import { useState, useEffect, useContext, useRef } from "react";
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
    completeAuction,
  } = useBiddingTurns(gameId, pokemon.id);

  const [auctionCompleted, setAuctionCompleted] = useState(false);
  const [winnerName, setWinnerName] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch winner
  useEffect(() => {
    if (pokemon.auction_status === "completed") {
      setAuctionCompleted(true);
      if (pokemon.current_bidder_id) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", pokemon.current_bidder_id)
          .single()
          .then(({ data }) => {
            setWinnerName(data?.username || "Unknown Player");
            setNotification(
              `${pokemon.pokemon_name} sold to ${data?.username || "Unknown Player"
              } for ${pokemon.current_price} coins!`
            );
          });
      }
      if (onSold) onSold();
    }
  }, [pokemon.auction_status, pokemon.current_bidder_id, onSold, pokemon.current_price, pokemon.pokemon_name]);

  // Animate notification
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

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

  // Auto-refresh bidder info every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (pokemon.current_bidder_id) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", pokemon.current_bidder_id)
          .single()
          .then(({ data }) => {
            if (data) {
              setHighestBidderName(data.username || "Unknown Player");
            }
          });
      }
    }, 2000);
    
    return () => clearInterval(timer);
  }, [pokemon.current_bidder_id]);

  // Sprite logic: Use official-artwork whenever possible, at least 200x200
  const [highResImage, setHighResImage] = useState<string>(pokemon.pokemon_image);
  useEffect(() => {
    let cancelled = false;
    async function fetchHighRes() {
      try {
        if (pokemon.pokemon_id) {
          const pokeRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokemon.pokemon_id}`
          );
          if (pokeRes.ok) {
            const pokeData = await pokeRes.json();
            const sprite = pokeData.sprites?.other?.["official-artwork"]?.front_default;
            if (sprite && !cancelled) setHighResImage(sprite);
          }
        }
      } catch (e) {
        // fallback to what's on nomination
      }
    }
    fetchHighRes();
    return () => { cancelled = true; }
  }, [pokemon.pokemon_id, pokemon.pokemon_image]);

  // Animation helpers
  const cardClass = `bg-white border-gray-200 overflow-hidden shadow transition-all duration-300 ${imgLoaded ? "animate-fadein" : "opacity-0"
    }`;
  const pulseClass = "animate-pulse shadow-lg ring-2 ring-blue-400";

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBid = async (increment: number) => {
    const newBid = pokemon.current_price + increment;
    const ok = await placeBid(newBid);
    if (!ok) {
      toast({
        title: "Insufficient Coins",
        description: "You do not have enough coins to place this bid.",
        variant: "destructive"
      });
    }
  };

  const handlePass = async () => {
    await passTurn();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      checkExpiredAuction();
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!auctionCompleted && timeRemaining === 0 && isMyTurn) {
      completeAuction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, auctionCompleted, isMyTurn]);

  if (auctionCompleted) {
    return (
      <>
        {notification && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-lg px-6 py-3 rounded-lg shadow-lg animate-fadein">
            {notification}
          </div>
        )}
        <Card
          className="bg-gray-900 border-green-500 overflow-hidden ring-2 ring-green-300 shadow-lg animate-fadein">
          <div className="bg-green-100 p-3 flex flex-col items-center">
            <img
              src={highResImage}
              alt={pokemon.pokemon_name}
              className="w-48 h-48 mx-auto opacity-90"
              style={{ filter: "drop-shadow(0 0 15px #22c55e80)" }}
              onLoad={() => setImgLoaded(true)}
            />
            <div className="font-semibold text-green-700 mt-2 text-lg">SOLD</div>
          </div>
          <CardContent className="p-4 text-center">
            <h3 className="text-lg font-semibold capitalize mb-2 text-white">
              {pokemon.pokemon_name}
            </h3>
            <div className="mb-2 text-green-200">
              The Pokémon is sold to{" "}
              <span className="text-blue-300 font-bold">{winnerName || "..."}</span>!
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-blue-700 text-white text-lg px-6 py-3 rounded-lg shadow-lg animate-fadein">
          {notification}
        </div>
      )}
      <Card className={`${cardClass} border-2 border-blue-400`}>
        <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-pink-600 p-4 relative flex flex-col items-center justify-center">
          <img
            src={highResImage}
            alt={pokemon.pokemon_name}
            className={`w-52 h-52 mx-auto transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}
              ${highestBidderName ? pulseClass : ""}`}
            style={{ filter: "drop-shadow(0 0 25px #0073ff33)" }}
            onLoad={() => setImgLoaded(true)}
          />
          {highestBidderName && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
              Highest: {highestBidderName}
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="text-2xl font-extrabold text-center capitalize text-gray-900 dark:text-white mb-2 tracking-tight">
            {pokemon.pokemon_name}
          </h3>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl text-rose-600 font-bold animate-pulse">
              {`$${pokemon.current_price}`}
            </span>
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-200">
              <Timer size={22} />
              <span className="text-xl font-mono">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          </div>
          {isMyTurn ? (
            <div className="mt-6 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleBid(25)}
                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 font-bold text-white text-lg animate-in fade-in"
                >
                  Bid +$25
                </Button>
                <Button
                  onClick={() => handleBid(50)}
                  className="bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 font-bold text-white text-lg animate-in fade-in"
                >
                  Bid +$50
                </Button>
              </div>
              <Button
                onClick={handlePass}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-200 font-bold mt-1"
              >
                Pass Turn
              </Button>
            </div>
          ) : (
            <div className="mt-6 p-2 bg-gray-100 dark:bg-gray-700 rounded text-center text-base text-gray-600 dark:text-gray-300 font-medium animate-pulse">
              {currentTurn ? "Waiting for other player's turn" : "Waiting for bidding to start"}
            </div>
          )}
          {pokemon.current_bidder_id && pokemon.current_bidder_id === user?.id && (
            <div className="mt-3 text-center text-base text-blue-600 font-semibold animate-pulse">
              You are the highest bidder
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// Add animation classes
// Fade-in: @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
// Pulse: will use Tailwind's animate-pulse
