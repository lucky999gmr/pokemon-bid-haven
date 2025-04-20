
import { CircleUser, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Player = {
  user_id: string;
  profiles?: {
    username: string;
  } | null;
};

type GameCardProps = {
  game: {
    id: string;
    name: string;
    code: string;
    max_players: number;
    host_id: string;
    players: Player[];
  };
  isHost: boolean;
  isStartingGame: boolean;
  onStartGame: () => void;
};

export const GameCard = ({ game, isHost, isStartingGame, onStartGame }: GameCardProps) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">{game.name}</h3>
          <p className="text-gray-400">Code: {game.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="text-gray-400" />
          <span className="text-gray-400">
            {game.players.length}/{game.max_players}
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {game.players.map((player) => (
          <div
            key={player.user_id}
            className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full"
          >
            <CircleUser className="text-gray-400" />
            <span className={`text-sm ${player.user_id === game.host_id ? 'text-yellow-400' : 'text-gray-200'}`}>
              {player.profiles?.username || 'Unknown User'}
            </span>
          </div>
        ))}
      </div>

      {isHost && (
        <Button
          onClick={onStartGame}
          className="w-full bg-red-500 hover:bg-red-600"
          disabled={game.players.length < 2 || isStartingGame}
        >
          {isStartingGame ? "Starting..." : "Start Game"}
        </Button>
      )}
    </div>
  );
};
