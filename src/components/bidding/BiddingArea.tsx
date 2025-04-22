
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PokemonSearch } from "./PokemonSearch";
import { PokemonCard } from "./PokemonCard";
import { useNominatedPokemon } from "@/hooks/use-nominated-pokemon";
import { useNominationTurns } from "@/hooks/use-nomination-turns";
import { useEffect, useContext, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { PlayerCollection } from "./PlayerCollection";

export const BiddingArea = ({ gameId }: { gameId: string }) => {
  const nominatedPokemon = useNominatedPokemon(gameId);
  const { user } = useContext(UserContext);
  const { isMyTurn, currentNominatorId } = useNominationTurns(gameId);
  const collectionRef = useRef<{ refreshCollection: () => void }>(null);

  // Refresh collection when Pokemon is sold
  const handlePokemonSold = () => {
    if (collectionRef.current) {
      collectionRef.current.refreshCollection();
    }
  };

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
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true });
        
      if (playersError || !players || players.length === 0) {
        console.error("Could not fetch players for turn initialization");
        return;
      }
      
      // For each uninitialized nomination, set the first player's turn
      for (const pokemon of uninitialized) {
        // Skip the nominator, start with the next player
        const nominatorIndex = players.findIndex(p => p.user_id === pokemon.current_bidder_id);
        const nextPlayerIndex = (nominatorIndex + 1) % players.length;
        
        await supabase
          .from("nominated_pokemon")
          .update({
            current_turn_player_id: players[nextPlayerIndex].id,
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
        <div className="flex justify-between items-center mb-4">
          <PokemonSearch gameId={gameId} isMyTurn={isMyTurn} currentNominatorId={currentNominatorId} />
          {user && (
            <PlayerCollection ref={collectionRef} playerId={user.id} />
          )}
        </div>

        {nominatedPokemon.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">
              {isMyTurn 
                ? "It's your turn to nominate a Pokémon. Search and nominate one to start bidding!"
                : "Waiting for the current player to nominate a Pokémon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nominatedPokemon.map((pokemon) => (
              <PokemonCard 
                key={pokemon.id} 
                pokemon={pokemon} 
                gameId={gameId} 
                onSold={handlePokemonSold}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
