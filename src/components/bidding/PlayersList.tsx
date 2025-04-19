import { useEffect, useState, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/App";
import { toast } from "@/hooks/use-toast";
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
export const PlayersList = ({
  gameId
}: {
  gameId: string;
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const {
    user
  } = useContext(UserContext);
  useEffect(() => {
    const fetchPlayers = async () => {
      // First get the players in the game
      const {
        data: playersData,
        error: playersError
      } = await supabase.from("players").select("id, user_id").eq("game_id", gameId);
      if (playersError || !playersData) {
        console.error("Error fetching players:", playersError);
        return;
      }

      // Then for each player, fetch their profile and balance
      const playersWithDetails = await Promise.all(playersData.map(async player => {
        // Fetch profile
        const {
          data: profileData
        } = await supabase.from("profiles").select("username").eq("id", player.user_id).single();

        // Fetch balance
        const {
          data: balanceData
        } = await supabase.from('player_balances').select("balance").eq("player_id", player.id);

        // Create a player object with properly typed data
        return {
          ...player,
          profiles: profileData || {
            username: "Unknown Player"
          },
          player_balances: balanceData ? balanceData : [{
            balance: 1000
          }]
        } as Player;
      }));
      setPlayers(playersWithDetails);
    };
    fetchPlayers();

    // Subscribe to player balance changes
    const channel = supabase.channel(`game-players:${gameId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'player_balances'
    }, () => {
      fetchPlayers();
    }).subscribe();
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
  return <Card className="bg-gray-100 border-gray-300 h-full">
      <CardHeader className="bg-gray-200 pb-3">
        <CardTitle className="text-xl">Participants</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {players.map(player => <div key={player.id} className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="text-blue-500" />
                  <span className="text-gray-950 font-extralight text-xs text-left">
                    {player.profiles?.username || "Unknown Player"}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => viewCollection(player.id)} className="border-blue-200 hover:bg-blue-50 px-0 py-0 my-0 mx-0 rounded-sm text-left text-sm font-light text-zinc-950">
                  Collection
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                Balance: ${player.player_balances[0]?.balance || 1000}
              </div>
            </div>)}
        </div>
      </CardContent>
    </Card>;
};