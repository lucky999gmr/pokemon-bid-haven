
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PokemonSearchProps {
  gameId: string;
}

export const PokemonSearch = ({ gameId }: PokemonSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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

  return (
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
  );
};
