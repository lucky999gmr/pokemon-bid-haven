
import { useEffect, useState } from "react";
import { CircleUser, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/App";
import { useContext } from "react";

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

export const GameList = () => {
  const [games, setGames] = useState<Game[]>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    // Initial fetch
    fetchGames();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('game-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games'
      }, () => {
        fetchGames();
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
  }, []);

  const fetchGames = async () => {
    try {
      // First, fetch games
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

      // Then for each game, fetch its players
      const gamesWithPlayers: Game[] = await Promise.all(
        gamesData.map(async (game) => {
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select(`
              user_id
            `)
            .eq('game_id', game.id);

          if (playersError) {
            console.error(`Error fetching players for game ${game.id}:`, playersError);
            return { ...game, players: [] };
          }

          // For each player, fetch their profile
          const playersWithProfiles: Player[] = await Promise.all(
            (playersData || []).map(async (player) => {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', player.user_id)
                .single();

              if (profileError) {
                console.error(`Error fetching profile for user ${player.user_id}:`, profileError);
                return { 
                  user_id: player.user_id,
                  profiles: null 
                };
              }

              return {
                user_id: player.user_id,
                profiles: profileData
              };
            })
          );

          return {
            ...game,
            players: playersWithProfiles
          };
        })
      );

      setGames(gamesWithPlayers);
    } catch (error) {
      console.error('Unexpected error in fetchGames:', error);
    }
  };

  const startGame = async (gameId: string) => {
    await supabase
      .from('games')
      .update({ status: 'in_progress' })
      .eq('id', gameId);
  };

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-gray-800 p-4 rounded-lg space-y-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">{game.name}</h3>
              <p className="text-gray-400">Code: {game.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="text-gray-400" />
              <span className="text-gray-400">
                {game.players.length}/{game.max_players}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {game.players.map((player) => (
              <div
                key={player.user_id}
                className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full"
              >
                <CircleUser className="text-gray-400" />
                <span className={`text-sm ${player.user_id === game.host_id ? 'text-yellow-400' : 'text-gray-200'}`}>
                  {player.profiles?.username || 'Unknown User'}
                </span>
              </div>
            ))}
          </div>

          {user?.id === game.host_id && (
            <Button
              onClick={() => startGame(game.id)}
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={game.players.length < 2}
            >
              Start Game
            </Button>
          )}
        </div>
      ))}

      {games.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No active games found
        </div>
      )}
    </div>
  );
};
