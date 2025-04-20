
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NominatedPokemon {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_image: string;
  current_price: number;
  current_bidder_id: string | null;
  current_turn_player_id: string | null;
  last_bid_at: string | null;
  auction_status: 'active' | 'completed' | 'expired';
  time_per_turn: number;
}

export const useNominatedPokemon = (gameId: string) => {
  const [nominatedPokemon, setNominatedPokemon] = useState<NominatedPokemon[]>([]);

  useEffect(() => {
    const fetchNominated = async () => {
      const { data, error } = await supabase
        .from('nominated_pokemon')
        .select("*")
        .eq("game_id", gameId)
        .eq("status", "active");

      if (!error && data) {
        setNominatedPokemon(data as NominatedPokemon[]);
      } else if (error) {
        console.error("Error fetching nominated Pokémon:", error);
      }
    };

    fetchNominated();

    const channel = supabase
      .channel(`game-nominations:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nominated_pokemon',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          fetchNominated();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return nominatedPokemon;
};
