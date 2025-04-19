
import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { Navbar } from "@/components/Navbar";
import { PlayersList } from "@/components/bidding/PlayersList";
import { BiddingArea } from "@/components/bidding/BiddingArea";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface Game {
  id: string;
  status: string;
  // Add other game properties as needed
}

const BiddingArena = () => {
  const { gameId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to access the bidding arena",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!gameId) {
      toast({
        title: "Game Not Found",
        description: "No game ID provided",
        variant: "destructive",
      });
      navigate("/lobby");
      return;
    }

    const fetchGame = async () => {
      const { data: gameData, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error || !gameData) {
        toast({
          title: "Game Not Found",
          description: "The requested game could not be found",
          variant: "destructive",
        });
        navigate("/lobby");
        return;
      }

      // Check if user is a participant
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .eq("user_id", user.id);

      if (playerError || !playerData || playerData.length === 0) {
        toast({
          title: "Access Denied",
          description: "You are not a participant in this game",
          variant: "destructive",
        });
        navigate("/lobby");
        return;
      }

      setGame(gameData);
      setLoading(false);
    };

    fetchGame();

    // Subscribe to game updates
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          // Fix: Add type checking to ensure payload.new exists and has a status property
          if (payload.new && typeof payload.new === 'object' && 'status' in payload.new) {
            setGame(payload.new as Game);
            
            // If game status changes to 'completed', redirect to results
            if ((payload.new as Game).status === 'completed') {
              toast({
                title: "Game Over",
                description: "The bidding phase has ended"
              });
              navigate(`/lobby`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="p-8 text-center bg-white">
            <p className="text-blue-800">Loading bidding arena...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <PlayersList gameId={gameId!} />
          </div>
          <div className="col-span-12 lg:col-span-9">
            <BiddingArea gameId={gameId!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingArena;
