
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { toast } from "@/hooks/use-toast";

export const useNominationTurns = (gameId: string) => {
  const [currentNominatorId, setCurrentNominatorId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [players, setPlayers] = useState<{id: string, user_id: string}[]>([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  // Fetch players in the game
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching players:", error);
        return;
      }

      if (data) {
        setPlayers(data);
        
        // If no nominator is set, initialize it to the first player
        if (!currentNominatorId && data.length > 0) {
          checkAndInitializeNominator(data[0].id);
        }
      }
    };

    fetchPlayers();
  }, [gameId, currentNominatorId]);

  // Initialize nominator if not already set
  const checkAndInitializeNominator = async (firstPlayerId: string) => {
    const { data, error } = await supabase
      .from("games")
      .select("current_nominator_id")
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("Error checking current nominator:", error);
      return;
    }

    if (!data.current_nominator_id) {
      await supabase
        .from("games")
        .update({ current_nominator_id: firstPlayerId })
        .eq("id", gameId);
    }
  };

  // Subscribe to changes in the current nominator
  useEffect(() => {
    const fetchCurrentNominator = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("games")
        .select("current_nominator_id")
        .eq("id", gameId)
        .single();

      if (error) {
        console.error("Error fetching nominator info:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setCurrentNominatorId(data.current_nominator_id);
      }
      
      setLoading(false);
    };

    fetchCurrentNominator();

    const channel = supabase
      .channel(`game-nominator:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        () => {
          fetchCurrentNominator();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  // Check if it's the current user's turn to nominate
  useEffect(() => {
    if (!user || !currentNominatorId) {
      setIsMyTurn(false);
      return;
    }

    const player = players.find(p => p.user_id === user.id);
    
    if (player && player.id === currentNominatorId) {
      setIsMyTurn(true);
      toast({
        title: "Your Turn to Nominate",
        description: "It's your turn to nominate a Pokémon for auction",
      });
    } else {
      setIsMyTurn(false);
    }
  }, [currentNominatorId, user, players]);

  // Move to the next player for nomination
  const moveToNextNominator = async () => {
    if (!currentNominatorId || players.length < 2) return;
    
    const currentIndex = players.findIndex(p => p.id === currentNominatorId);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayerId = players[nextIndex].id;
    
    try {
      const { error } = await supabase
        .from("games")
        .update({ current_nominator_id: nextPlayerId })
        .eq("id", gameId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating nominator:", error);
    }
  };

  return {
    currentNominatorId,
    isMyTurn,
    players,
    loading,
    moveToNextNominator
  };
};
