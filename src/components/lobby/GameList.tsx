
import { useGameList } from "@/hooks/use-game-list";
import { GameCard } from "./GameCard";

export const GameList = () => {
  const { games, isStartingGame, startGame, user } = useGameList();

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          isHost={user?.id === game.host_id}
          isStartingGame={isStartingGame === game.id}
          onStartGame={() => startGame(game.id)}
        />
      ))}

      {games.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No active games found
        </div>
      )}
    </div>
  );
};
