
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PokemonSearch } from "./PokemonSearch";
import { PokemonCard } from "./PokemonCard";
import { useNominatedPokemon } from "@/hooks/use-nominated-pokemon";

export const BiddingArea = ({ gameId }: { gameId: string }) => {
  const nominatedPokemon = useNominatedPokemon(gameId);

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
