
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useContext } from "react";
import { UserContext } from "@/App";
import type { NominatedPokemon } from "@/hooks/use-nominated-pokemon";

interface PokemonCardProps {
  pokemon: NominatedPokemon;
  gameId: string;
}

export const PokemonCard = ({ pokemon, gameId }: PokemonCardProps) => {
  const { user } = useContext(UserContext);

  const placeBid = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to place a bid",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .single();

      if (playerError || !playerData) {
        throw new Error("You are not a player in this game");
      }

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
    <Card className="bg-white border-gray-200 overflow-hidden">
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
          onClick={placeBid}
        >
          Place Bid (+$50)
        </Button>
      </CardContent>
    </Card>
  );
};
