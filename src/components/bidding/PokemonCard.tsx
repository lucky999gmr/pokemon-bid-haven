
import { useState, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { Timer } from "lucide-react";
import type { NominatedPokemon } from "@/hooks/use-nominated-pokemon";
import { useBiddingTurns } from "@/hooks/use-bidding-turns";

interface PokemonCardProps {
  pokemon: NominatedPokemon;
  gameId: string;
}

export const PokemonCard = ({ pokemon, gameId }: PokemonCardProps) => {
  const { user } = useContext(UserContext);
  const [bidAmount, setBidAmount] = useState(pokemon.current_price + 50);
  const { 
    currentTurn, 
    isMyTurn, 
    timeRemaining, 
    placeBid, 
    passTurn, 
    checkExpiredAuction 
  } = useBiddingTurns(gameId, pokemon.id);

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > pokemon.current_price) {
      setBidAmount(value);
    }
  };

  const handleBidSubmit = async () => {
    if (bidAmount <= pokemon.current_price) {
      toast({
        title: "Invalid Bid",
        description: "Your bid must be higher than the current price",
        variant: "destructive",
      });
      return;
    }

    const success = await placeBid(bidAmount);
    if (success) {
      setBidAmount(prevBid => prevBid + 50);
    }
  };

  const handlePass = async () => {
    await passTurn();
    // Check if this completes a full round of passes
    checkExpiredAuction();
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
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-green-600 text-lg font-bold">
            ${pokemon.current_price}
          </span>
          
          <div className="flex items-center gap-1 text-gray-500">
            <Timer size={16} />
            <span className="text-sm font-mono">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        </div>
        
        {isMyTurn ? (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={bidAmount}
                onChange={handleBidAmountChange}
                className="w-full rounded border border-gray-300 p-2 text-sm"
                min={pokemon.current_price + 1}
              />
              <Button 
                onClick={handleBidSubmit}
                className="bg-green-500 hover:bg-green-600"
              >
                Bid
              </Button>
            </div>
            <Button 
              onClick={handlePass}
              variant="outline" 
              className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Pass Turn
            </Button>
          </div>
        ) : (
          <div className="mt-4 p-2 bg-gray-100 rounded text-center text-sm text-gray-600">
            {currentTurn ? "Waiting for other player's turn" : "Waiting for bidding to start"}
          </div>
        )}
        
        {pokemon.current_bidder_id && pokemon.current_bidder_id === user?.id && (
          <div className="mt-2 text-center text-sm text-blue-600 font-medium">
            You are the highest bidder
          </div>
        )}
      </CardContent>
    </Card>
  );
};
