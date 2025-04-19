
import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { Navbar } from "@/components/Navbar";
import { PlayersList } from "@/components/bidding/PlayersList";
import { BiddingArea } from "@/components/bidding/BiddingArea";
import { Card } from "@/components/ui/card";

const BiddingArena = () => {
  const { gameId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!gameId) {
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
          setGame(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-white">Loading game...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-12 gap-8">
        <div className="col-span-3">
          <PlayersList gameId={gameId} />
        </div>
        <div className="col-span-9">
          <BiddingArea gameId={gameId} />
        </div>
      </div>
    </div>
  );
};

export default BiddingArena;
