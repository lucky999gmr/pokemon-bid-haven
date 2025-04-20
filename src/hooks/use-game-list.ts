
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { toast } from "@/hooks/use-toast";

type Player = {
  user_id: string;
  profiles?: {
    username: string;
  } | null;
};

type Game = {
  id: string;
  name: string;
  code: string;
  max_players: number;
  host_id: string;
  status: string;
  players: Player[];
};

export const useGameList = () => {
  const [games, setGames] = useState<Game[]>([]);
  const { user } = useContext(UserContext);
  const [isStartingGame, setIsStartingGame] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkIfUserInGame = async (gameId: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', user.id);
      
    return !!playerData && playerData.length > 0;
  };

  const fetchGames = async () => {
    try {
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          name,
          code,
          max_players,
          host_id,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        return;
      }

      if (!gamesData || gamesData.length === 0) {
        setGames([]);
        return;
      }

      const gamesWithPlayers = await Promise.all(
        gamesData.map(async (game) => {
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select(`user_id`)
            .eq('game_id', game.id);

          if (playersError) {
            console.error(`Error fetching players for game ${game.id}:`, playersError);
            return { ...game, players: [] };
          }

          const playersWithProfiles = await Promise.all(
            (playersData || []).map(async (player) => {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', player.user_id)
                .single();

              if (profileError) {
                console.error(`Error fetching profile for user ${player.user_id}:`, profileError);
                return { user_id: player.user_id, profiles: null };
              }

              return { user_id: player.user_id, profiles: profileData };
            })
          );

          return { ...game, players: playersWithProfiles };
        })
      );

      setGames(gamesWithPlayers);
    } catch (error) {
      console.error('Unexpected error in fetchGames:', error);
    }
  };

  const startGame = async (gameId: string) => {
    if (isStartingGame) return;
    
    setIsStartingGame(gameId);
    try {
      const { data: players } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', gameId);
      
      if (players) {
        for (const player of players) {
          await supabase
            .from('player_balances')
            .insert({
              player_id: player.id,
              balance: 1000
            });
        }
      }

      const { error } = await supabase
        .from('games')
        .update({ status: 'in_progress' })
        .eq('id', gameId);
      
      if (error) throw error;
      
      navigate(`/arena/${gameId}`);
      
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      });
      setIsStartingGame(null);
    }
  };

  useEffect(() => {
    fetchGames();

    const channel = supabase
      .channel('game-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games'
      }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object' && 'status' in payload.new) {
          const updatedGame = payload.new as { id: string; status: string };
          
          if (updatedGame.status === 'in_progress') {
            console.log('Game started:', updatedGame.id);
            checkIfUserInGame(updatedGame.id).then(isInGame => {
              if (isInGame) {
                console.log('User is in this game, redirecting to arena');
                navigate(`/arena/${updatedGame.id}`);
              }
            });
          }
          fetchGames();
        } else {
          fetchGames();
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, () => {
        fetchGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  return {
    games,
    isStartingGame,
    startGame,
    user
  };
};
