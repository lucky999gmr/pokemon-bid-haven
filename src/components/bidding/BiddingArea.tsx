
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NominatedPokemon {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_image: string;
  current_price: number;
  current_bidder_id: string | null;
}

export const BiddingArea = ({ gameId }: { gameId: string }) => {
  const [nominatedPokemon, setNominatedPokemon] = useState<NominatedPokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchNominated = async () => {
      // Use a raw query with string interpolation to work around TypeScript limitations
      const { data, error } = await supabase
        .from('nominated_pokemon' as any)
        .select("*")
        .eq("game_id", gameId)
        .eq("status", "active");

      if (!error && data) {
        // Use a double casting through unknown to satisfy TypeScript
        setNominatedPokemon(data as unknown as NominatedPokemon[]);
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

      const searchValue = searchTerm.toLowerCase();
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchValue}`);
      const data = await response.json();

      // Use a more TypeScript-friendly approach with type assertion
      await supabase.from('nominated_pokemon' as any).insert({
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
        description: "Failed to nominate Pokémon. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Bidding Arena</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-8">
          <Input
            type="text"
            placeholder="Search Pokémon to nominate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Button onClick={handleSearchPokemon}>
            <Search className="mr-2" />
            Nominate
          </Button>
        </div>

        {nominatedPokemon.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No Pokémon nominated yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nominatedPokemon.map((pokemon) => (
              <Card key={pokemon.id} className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <img
                    src={pokemon.pokemon_image}
                    alt={pokemon.pokemon_name}
                    className="w-32 h-32 mx-auto"
                  />
                  <h3 className="text-lg font-semibold text-white text-center mt-2 capitalize">
                    {pokemon.pokemon_name}
                  </h3>
                  <div className="text-center mt-2">
                    <span className="text-green-400 text-lg">
                      ${pokemon.current_price}
                    </span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Place Bid
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
