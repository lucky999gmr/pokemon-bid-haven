
import { useEffect, useState, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Award } from "lucide-react";
import { UserContext } from "@/App";
import { PlayerCollection } from "./PlayerCollection";

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
  const { user } = useContext(UserContext);

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

          // Fetch balance
          const { data: balanceData } = await supabase
            .from('player_balances')
            .select("balance")
            .eq("player_id", player.id);

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
        })
      );
      setPlayers(playersWithDetails);
    };
    
    fetchPlayers();

    // Subscribe to player balance changes
    const channel = supabase
      .channel(`game-players:${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_balances'
      }, () => {
        fetchPlayers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_collections'
      }, () => {
        fetchPlayers();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return (
    <Card className="bg-gray-100 border-gray-300 h-full">
      <CardHeader className="bg-gray-200 pb-3">
        <CardTitle className="text-xl">Participants</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`flex flex-col bg-white p-3 rounded-lg border ${
                player.user_id === user?.id 
                  ? 'border-blue-300 shadow-sm' 
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className={player.user_id === user?.id ? "text-blue-500" : "text-gray-500"} />
                  <span className={`text-gray-950 font-medium text-sm ${
                    player.user_id === user?.id ? 'text-blue-900' : ''
                  }`}>
                    {player.profiles?.username || "Unknown Player"}
                    {player.user_id === user?.id && " (You)"}
                  </span>
                </div>
                <PlayerCollection playerId={player.id} />
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <div className="text-sm text-gray-600">
                  Balance: ${player.player_balances[0]?.balance || 1000}
                </div>
                <div className="flex items-center">
                  <Award className="text-yellow-500 h-4 w-4 mr-1" />
                  <span className="text-xs text-gray-500">
                    {/* We'll update this with collection count */}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
