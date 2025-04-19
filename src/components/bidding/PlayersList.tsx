
import { useEffect, useState, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/App";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PlayerBalance {
  balance: number;
}

interface PlayerProfile {
  username: string;
}

interface Player {
  id: string;
  user_id: string;
  profiles: PlayerProfile;
  player_balances: PlayerBalance[];
}

export const PlayersList = ({ gameId }: { gameId: string }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlayers = async () => {
      // First get the players in the game
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId);

      if (playersError || !playersData) {
        console.error("Error fetching players:", playersError);
        return;
      }

      // Then for each player, fetch their profile and balance
      const playersWithDetails = await Promise.all(
        playersData.map(async (player) => {
          // Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", player.user_id)
            .single();

          // Fetch balance using type assertions to work around type issues
          const { data: balanceData } = await supabase
            .from('player_balances' as any)
            .select("balance")
            .eq("player_id", player.id);

          return {
            ...player,
            profiles: profileData || { username: "Unknown Player" },
            player_balances: balanceData || [{ balance: 1000 }]
          } as unknown as Player;
        })
      );

      setPlayers(playersWithDetails);
    };

    fetchPlayers();

    // Subscribe to player changes
    const channel = supabase
      .channel(`game-players:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_balances',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const viewCollection = (playerId: string) => {
    toast({
      title: "Coming Soon",
      description: "The collection feature is under development"
    });
  };

  return (
    <Card className="bg-gray-100 border-gray-300 h-full">
      <CardHeader className="bg-gray-200 pb-3">
        <CardTitle className="text-xl">Participants</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="text-blue-500" />
                  <span className="font-medium">
                    {player.profiles?.username || "Unknown Player"}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-500 border-blue-200 hover:bg-blue-50"
                  onClick={() => viewCollection(player.id)}
                >
                  Collection
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                Balance: ${player.player_balances[0]?.balance || 1000}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
