
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { toast } from "@/hooks/use-toast";

export const useBiddingTurns = (
  gameId: string,
  nominationId: string | null
) => {
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [players, setPlayers] = useState<{id: string, user_id: string}[]>([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timerId]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId);

      if (error) {
        console.error("Error fetching players:", error);
        return;
      }

      if (data) {
        setPlayers(data);
      }
    };

    fetchPlayers();
  }, [gameId]);

  useEffect(() => {
    if (!nominationId) return;

    const fetchCurrentTurn = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("nominated_pokemon")
        .select(`
          current_turn_player_id, 
          last_bid_at, 
          time_per_turn,
          current_bidder_id,
          current_price,
          pokemon_id,
          pokemon_name,
          pokemon_image
        `)
        .eq("id", nominationId)
        .single();

      if (error) {
        console.error("Error fetching turn info:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setCurrentTurn(data.current_turn_player_id);
        
        if (data.last_bid_at && data.time_per_turn) {
          const lastBidTime = new Date(data.last_bid_at).getTime();
          const currentTime = new Date().getTime();
          const elapsed = (currentTime - lastBidTime) / 1000; // seconds
          const remaining = Math.max(0, data.time_per_turn - elapsed);
          
          setTimeRemaining(Math.round(remaining));

          if (timerId) clearInterval(timerId);
          
          const newTimer = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev === null || prev <= 0) {
                clearInterval(newTimer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          setTimerId(newTimer);
        }
      }
      
      setLoading(false);
    };

    fetchCurrentTurn();

    const channel = supabase
      .channel(`nomination-turn:${nominationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nominated_pokemon",
          filter: `id=eq.${nominationId}`,
        },
        () => {
          fetchCurrentTurn();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerId) clearInterval(timerId);
    };
  }, [nominationId, gameId, timerId]);

  useEffect(() => {
    if (!user || !currentTurn) {
      setIsMyTurn(false);
      return;
    }

    const player = players.find(p => p.user_id === user.id);
    
    if (player && player.id === currentTurn) {
      setIsMyTurn(true);
      toast({
        title: "Your Turn!",
        description: "It's your turn to place a bid",
      });
    } else {
      setIsMyTurn(false);
    }
  }, [currentTurn, user, players]);

  useEffect(() => {
    if (timeRemaining === 0 && nominationId) {
      (async () => {
        const nextPlayer = getNextPlayer();
        if (nextPlayer) {
          await updateTurn(nextPlayer);
        }
      })();
    }
  }, [timeRemaining, nominationId]);

  const getNextPlayer = () => {
    if (!currentTurn || players.length < 2) return null;
    
    const currentIndex = players.findIndex(p => p.id === currentTurn);
    if (currentIndex === -1) return players[0].id;
    
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].id;
  };

  const updateTurn = async (nextPlayerId: string) => {
    if (!nominationId) return;
    
    const { error } = await supabase
      .from("nominated_pokemon")
      .update({
        current_turn_player_id: nextPlayerId,
        last_bid_at: new Date().toISOString()
      })
      .eq("id", nominationId);

    if (error) {
      console.error("Error updating turn:", error);
    }
  };

  // Modified to accept fixed bid increments
  const placeBid = async (amount: number) => {
    if (!isMyTurn || !user || !nominationId) {
      toast({
        title: "Not Your Turn",
        description: "Please wait for your turn to place a bid",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_id", gameId)
        .single();

      if (playerError || !playerData) {
        throw new Error("Could not find your player data");
      }

      const { data: balanceData, error: balanceError } = await supabase
        .from('player_balances')
        .select("balance")
        .eq("player_id", playerData.id)
        .single();

      if (balanceError || !balanceData) {
        throw new Error("Could not retrieve your balance");
      }

      if (balanceData.balance < amount) {
        throw new Error("Insufficient balance to place this bid");
      }

      const nextPlayer = getNextPlayer();
      
      const { error: updateError } = await supabase
        .from('nominated_pokemon')
        .update({
          current_price: amount,
          current_bidder_id: user.id,
          current_turn_player_id: nextPlayer,
          last_bid_at: new Date().toISOString()
        })
        .eq("id", nominationId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Bid Placed",
        description: `You placed a bid of $${amount}!`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
      return false;
    }
  };

  const passTurn = async () => {
    if (!isMyTurn || !nominationId) {
      toast({
        title: "Not Your Turn",
        description: "It's not your turn to pass",
        variant: "destructive",
      });
      return;
    }

    const nextPlayer = getNextPlayer();
    if (nextPlayer) {
      await updateTurn(nextPlayer);
      toast({
        title: "Turn Passed",
        description: "You passed your turn"
      });
    }
  };

  const completeAuction = async () => {
    if (!nominationId || !user) return;
    
    try {
      const { data: nomination, error: fetchError } = await supabase
        .from("nominated_pokemon")
        .select(`
          current_bidder_id, 
          current_price, 
          pokemon_id, 
          pokemon_name, 
          pokemon_image
        `)
        .eq("id", nominationId)
        .single();
        
      if (fetchError || !nomination) {
        throw new Error("Could not retrieve auction details");
      }
      
      if (!nomination.current_bidder_id) {
        throw new Error("No bids have been placed yet");
      }
      
      const { data: winnerPlayer, error: winnerError } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", nomination.current_bidder_id)
        .eq("game_id", gameId)
        .single();
        
      if (winnerError || !winnerPlayer) {
        throw new Error("Could not find winner's player data");
      }
      
      const { data: newBalance, error: rpcError } = await supabase.rpc(
        'decrement_balance', { 
          player_id: winnerPlayer.id,
          amount: nomination.current_price
        }
      );
      
      if (rpcError) {
        throw new Error("Failed to update winner's balance");
      }
      
      const { error: balanceError } = await supabase
        .from("player_balances")
        .update({ balance: newBalance })
        .eq("player_id", winnerPlayer.id);
        
      if (balanceError) {
        throw new Error("Failed to update winner's balance");
      }
      
      const { error: updateError } = await supabase
        .from("nominated_pokemon")
        .update({
          status: "completed",
          auction_status: "completed"
        })
        .eq("id", nominationId);
        
      if (updateError) {
        throw updateError;
      }
      
      const { error: collectionError } = await supabase
        .from("player_collections")
        .insert({
          player_id: winnerPlayer.id,
          pokemon_id: nomination.pokemon_id,
          pokemon_name: nomination.pokemon_name,
          pokemon_image: nomination.pokemon_image,
          acquisition_price: nomination.current_price
        });
        
      if (collectionError) {
        throw new Error("Failed to add Pokémon to winner's collection");
      }
      
      toast({
        title: "Auction Complete",
        description: `The Pokémon has been added to the winner's collection!`
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete auction",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkExpiredAuction = async () => {
    if (timeRemaining === 0 && nominationId) {
      if (players.length > 0 && currentTurn === players[0].id) {
        await completeAuction();
      }
    }
  };

  return {
    currentTurn,
    isMyTurn,
    timeRemaining,
    loading,
    placeBid,
    passTurn,
    completeAuction,
    checkExpiredAuction
  };
};
