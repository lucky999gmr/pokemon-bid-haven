
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

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

          // Fetch balance using raw query to work around type issues
          const { data: balanceData } = await supabase
            .from('player_balances')
            .select("balance")
            .eq("player_id", player.id);

          return {
            ...player,
            profiles: profileData || { username: "Unknown Player" },
            player_balances: balanceData || [{ balance: 1000 }]
          } as Player;
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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-700"
            >
              <div className="flex items-center gap-2">
                <User className="text-gray-400" />
                <span className="text-white">
                  {player.profiles?.username || "Unknown Player"}
                </span>
              </div>
              <span className="text-green-400">
                ${player.player_balances[0]?.balance || 1000}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
