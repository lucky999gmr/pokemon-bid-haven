
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { UserContext } from "@/App";

interface NominatedPokemon {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_image: string;
  current_price: number;
  current_bidder_id: string | null;
}

interface PlayerBalance {
  balance: number;
}

export const BiddingArea = ({ gameId }: { gameId: string }) => {
  const [nominatedPokemon, setNominatedPokemon] = useState<NominatedPokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const fetchNominated = async () => {
      const { data, error } = await supabase
        .from('nominated_pokemon')
        .select("*")
        .eq("game_id", gameId)
        .eq("status", "active");

      if (!error && data) {
        setNominatedPokemon(data as NominatedPokemon[]);
      }
    };

    fetchNominated();

    // Subscribe to nomination changes
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

  const handleSearchPokemon = async () => {
    try {
      if (!searchTerm.trim()) return;
      setIsSearching(true);

      const searchValue = searchTerm.toLowerCase();
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchValue}`);
      
      if (!response.ok) {
        throw new Error("Pokémon not found");
      }
      
      const data = await response.json();

      await supabase.from('nominated_pokemon').insert({
        game_id: gameId,
        pokemon_id: data.id,
        pokemon_name: data.name,
        pokemon_image: data.sprites.other["official-artwork"].front_default,
        current_price: 50,
        status: "active"
      });

      setSearchTerm("");
      toast({
        title: "Success",
        description: `${data.name} has been nominated for bidding!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find Pokémon. Please check the name or ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const placeBid = async (pokemon: NominatedPokemon) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to place a bid",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current player in the game
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .single();

      if (playerError || !playerData) {
        throw new Error("You are not a player in this game");
      }

      // Get player's balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('player_balances')
        .select("balance")
        .eq("player_id", playerData.id)
        .single();

      if (balanceError || !balanceData || typeof balanceData.balance !== 'number') {
        throw new Error("Could not retrieve your balance");
      }

      const newBidAmount = pokemon.current_price + 50;

      if (balanceData.balance < newBidAmount) {
        throw new Error("Insufficient balance to place this bid");
      }

      // Update the pokemon with the new bid
      const { error: updateError } = await supabase
        .from('nominated_pokemon')
        .update({
          current_price: newBidAmount,
          current_bidder_id: user.id
        })
        .eq("id", pokemon.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Bid Placed",
        description: `You placed a bid of $${newBidAmount} on ${pokemon.pokemon_name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-sky-100 border-blue-200 shadow-lg overflow-hidden">
      <CardHeader className="bg-blue-500 pb-2">
        <CardTitle className="text-white text-2xl text-center">Pokémon Bidding Arena</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-white rounded-lg p-4 shadow mb-6">
          <h3 className="font-semibold mb-3">Search and Nominate Pokémon</h3>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search Pokémon (e.g., Pikachu)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-300"
            />
            <Button 
              onClick={handleSearchPokemon} 
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Nominate Pokémon"}
            </Button>
          </div>
        </div>

        {nominatedPokemon.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">No Pokémon nominated yet. Search and nominate one to start bidding!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nominatedPokemon.map((pokemon) => (
              <Card key={pokemon.id} className="bg-white border-gray-200 overflow-hidden">
                <div className="bg-gray-100 p-3">
                  <img
                    src={pokemon.pokemon_image}
                    alt={pokemon.pokemon_name}
                    className="w-32 h-32 mx-auto"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-center mt-2 capitalize">
                    {pokemon.pokemon_name}
                  </h3>
                  <div className="text-center mt-2">
                    <span className="text-green-600 text-lg font-bold">
                      ${pokemon.current_price}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-blue-500 hover:bg-blue-600" 
                    onClick={() => placeBid(pokemon)}
                  >
                    Place Bid (+$50)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
