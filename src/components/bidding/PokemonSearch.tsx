
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { useNominationTurns } from "@/hooks/use-nomination-turns";

interface PokemonSearchProps {
  gameId: string;
  isMyTurn: boolean;
  currentNominatorId: string | null;
}

export const PokemonSearch = ({ gameId, isMyTurn, currentNominatorId }: PokemonSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useContext(UserContext);
  const { moveToNextNominator } = useNominationTurns(gameId);

  const handleSearchPokemon = async () => {
    try {
      if (!searchTerm.trim() || !isMyTurn) {
        if (!isMyTurn) {
          toast({
            title: "Not Your Turn",
            description: "It's not your turn to nominate a Pokémon",
            variant: "destructive",
          });
        }
        return;
      }
      
      setIsSearching(true);

      const searchValue = searchTerm.toLowerCase();
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchValue}`);
      
      if (!response.ok) {
        throw new Error("Pokémon not found");
      }
      
      const data = await response.json();
      
      // Get the player ID for the current user
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user?.id)
        .eq("game_id", gameId)
        .single();
        
      if (playerError || !playerData) {
        throw new Error("Could not retrieve your player information");
      }

      // Get all players to set up the first bidder
      const { data: allPlayers, error: playersError } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true });
        
      if (playersError || !allPlayers || allPlayers.length === 0) {
        throw new Error("Could not retrieve players");
      }
      
      // Find the next player (not the nominator) to be the first bidder
      let firstBidderIndex = allPlayers.findIndex(p => p.id === playerData.id);
      let nextPlayerIndex = (firstBidderIndex + 1) % allPlayers.length;
      const firstBidder = allPlayers[nextPlayerIndex].id;

      // Initial bid amount
      const initialBid = 50;

      // Create the nomination with the current user as the initial highest bidder
      await supabase.from('nominated_pokemon').insert({
        game_id: gameId,
        pokemon_id: data.id,
        pokemon_name: data.name,
        pokemon_image: data.sprites.other["official-artwork"].front_default,
        current_price: initialBid,
        current_bidder_id: user?.id, // Current user is the initial highest bidder
        current_turn_player_id: firstBidder, // Set the next player as the first to bid
        last_bid_at: new Date().toISOString(),
        status: "active",
        auction_status: "active",
        time_per_turn: 30
      });

      // Move to the next player for nomination
      moveToNextNominator();

      setSearchTerm("");
      toast({
        title: "Success",
        description: `${data.name} has been nominated for bidding with your initial bid of $${initialBid}!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to find Pokémon. Please check the name or ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-6">
      <h3 className="font-semibold mb-3">
        {isMyTurn 
          ? "Your Turn: Search and Nominate a Pokémon" 
          : "Waiting for Current Player to Nominate"}
      </h3>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search Pokémon (e.g., Pikachu)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-gray-300"
          disabled={!isMyTurn}
        />
        <Button 
          onClick={handleSearchPokemon} 
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={isSearching || !isMyTurn}
        >
          {isSearching ? "Searching..." : "Nominate Pokémon"}
        </Button>
      </div>
    </div>
  );
};
