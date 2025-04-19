
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

interface Player {
  id: string;
  user_id: string;
  profiles: {
    username: string;
  };
  player_balances: {
    balance: number;
  }[];
}

export const PlayersList = ({ gameId }: { gameId: string }) => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select(`
          *,
          profiles:user_id(username),
          player_balances(balance)
        `)
        .eq("game_id", gameId);

      if (!error && data) {
        setPlayers(data);
      }
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
