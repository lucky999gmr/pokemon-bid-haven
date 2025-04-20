
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PokemonSearch } from "./PokemonSearch";
import { PokemonCard } from "./PokemonCard";
import { useNominatedPokemon } from "@/hooks/use-nominated-pokemon";
import { useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";

export const BiddingArea = ({ gameId }: { gameId: string }) => {
  const nominatedPokemon = useNominatedPokemon(gameId);
  const { user } = useContext(UserContext);

  // Initialize turn for new nominations
  useEffect(() => {
    const initializeTurns = async () => {
      if (!user) return;
      
      // Find nominations that don't have a current turn set
      const uninitialized = nominatedPokemon.filter(pokemon => 
        pokemon.current_turn_player_id === null && 
        pokemon.auction_status === 'active'
      );
      
      if (uninitialized.length === 0) return;
      
      // Get players for this game
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId);
        
      if (playersError || !players || players.length === 0) {
        console.error("Could not fetch players for turn initialization");
        return;
      }
      
      // For each uninitialized nomination, set the first player's turn
      for (const pokemon of uninitialized) {
        await supabase
          .from("nominated_pokemon")
          .update({
            current_turn_player_id: players[0].id,
            last_bid_at: new Date().toISOString(),
            time_per_turn: 30 // 30 seconds per turn
          })
          .eq("id", pokemon.id);
      }
    };
    
    initializeTurns();
  }, [nominatedPokemon, gameId, user]);

  return (
    <Card className="bg-sky-100 border-blue-200 shadow-lg overflow-hidden">
      <CardHeader className="bg-blue-500 pb-2">
        <CardTitle className="text-white text-2xl text-center">Pokémon Bidding Arena</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <PokemonSearch gameId={gameId} />

        {nominatedPokemon.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">No Pokémon nominated yet. Search and nominate one to start bidding!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nominatedPokemon.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} gameId={gameId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
