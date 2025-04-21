
import { useState, useEffect, useContext } from "react";
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
  // Optionally, allow a prop for onSold (for refresh)
  onSold?: () => void;
}

export const PokemonCard = ({ pokemon, gameId, onSold }: PokemonCardProps) => {
  const { user } = useContext(UserContext);
  const [highestBidderName, setHighestBidderName] = useState<string>("");
  const { 
    currentTurn, 
    isMyTurn, 
    timeRemaining, 
    placeBid, 
    passTurn, 
    checkExpiredAuction,
    completeAuction
  } = useBiddingTurns(gameId, pokemon.id);

  const [auctionCompleted, setAuctionCompleted] = useState(false);
  const [winnerName, setWinnerName] = useState<string>("");

  // Update instantly when auction completes
  useEffect(() => {
    if (pokemon.auction_status === "completed") {
      setAuctionCompleted(true);
      // Fetch winner info if available
      if (pokemon.current_bidder_id) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", pokemon.current_bidder_id)
          .single()
          .then(({ data }) => {
            setWinnerName(data?.username || "Unknown Player");
          });
      }
      // Optionally call onSold so parent can refresh collection lists, etc.
      if (onSold) onSold();
    }
  }, [pokemon.auction_status, pokemon.current_bidder_id, onSold]);

  // Always update highest bidder after each render, so it's freshest
  useEffect(() => {
    let isMounted = true;
    const fetchBidderName = async () => {
      if (!pokemon.current_bidder_id) {
        setHighestBidderName("");
        return;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", pokemon.current_bidder_id)
        .single();
        
      if (!isMounted) return;
      if (error) {
        setHighestBidderName("Unknown");
        return;
      }
      if (data) {
        setHighestBidderName(data.username || "Unknown Player");
      }
    };
    
    fetchBidderName();
    return () => { isMounted = false; };
  }, [pokemon.current_bidder_id]);

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBid25 = () => placeBid(pokemon.current_price + 25);
  const handleBid50 = () => placeBid(pokemon.current_price + 50);

  const handlePass = async () => {
    await passTurn();
    // Check if this completes a full round of passes
    checkExpiredAuction();
  };

  // Try to auto-complete auction if no one else bids and out of time (as a fallback)
  useEffect(() => {
    if (!auctionCompleted && timeRemaining === 0 && isMyTurn) {
      completeAuction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, auctionCompleted, isMyTurn]);

  if (auctionCompleted) {
    return (
      <Card className="bg-white border-green-300 overflow-hidden opacity-90 ring-2 ring-green-400 shadow-lg">
        <div className="bg-green-100 p-3 flex flex-col items-center">
          <img
            src={pokemon.pokemon_image}
            alt={pokemon.pokemon_name}
            className="w-32 h-32 mx-auto opacity-75"
          />
          <div className="font-semibold text-green-700 mt-2 text-lg">SOLD</div>
        </div>
        <CardContent className="p-4 text-center">
          <h3 className="text-lg font-semibold capitalize mb-2">
            {pokemon.pokemon_name}
          </h3>
          <div className="mb-2">
            The Pokémon is sold to{" "}
            <span className="text-blue-600 font-medium">{winnerName || "..."}</span>!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 overflow-hidden">
      <div className="bg-gray-100 p-3 relative">
        <img
          src={pokemon.pokemon_image}
          alt={pokemon.pokemon_name}
          className="w-32 h-32 mx-auto"
        />
        {highestBidderName && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Highest: {highestBidderName}
          </div>
        )}
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
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleBid25}
                className="bg-green-500 hover:bg-green-600"
              >
                Bid +$25
              </Button>
              <Button 
                onClick={handleBid50}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Bid +$50
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

