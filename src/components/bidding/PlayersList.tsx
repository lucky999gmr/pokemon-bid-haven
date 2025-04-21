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
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId);

      if (playersError || !playersData) {
        console.error("Error fetching players:", playersError);
        return;
      }

      const playersWithDetails = await Promise.all(
        playersData.map(async (player) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", player.user_id)
            .single();

          const { data: balanceData } = await supabase
            .from('player_balances')
            .select("balance")
            .eq("player_id", player.id);

          return {
            ...player,
            profiles: profileData || {
              username: "Unknown Player"
            },
            player_balances: balanceData ? balanceData : [{
              balance: 0
            }]
          } as Player;
        })
      );
      setPlayers(playersWithDetails);
    };

    fetchPlayers();

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
    <Card className="bg-gray-900 border-gray-700 h-full">
      <CardHeader className="bg-gradient-to-r from-blue-700 via-pink-700 to-red-600 pb-3">
        <CardTitle className="text-white text-xl">Participants</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {players.map(player => (
            <div
              key={player.id}
              className={`flex flex-col bg-gray-800 p-3 rounded-lg border ${
                player.user_id === user?.id
                  ? 'border-blue-300 shadow-md'
                  : 'border-gray-600 shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className={player.user_id === user?.id ? "text-blue-300" : "text-gray-400"} />
                  <span className={`font-medium text-sm ${player.user_id === user?.id ? 'text-blue-100' : 'text-gray-200'}`}>
                    {player.profiles?.username || "Unknown Player"}
                    {player.user_id === user?.id && " (You)"}
                  </span>
                </div>
                <PlayerCollection playerId={player.id} />
              </div>

              <div className="flex justify-between items-center mt-1">
                <div className="text-sm text-blue-400 font-bold">
                  Coins: ${player.player_balances[0]?.balance || 0}
                </div>
                <div className="flex items-center">
                  <Award className="text-yellow-400 h-4 w-4 mr-1" />
                  <span className="text-xs text-gray-300"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
