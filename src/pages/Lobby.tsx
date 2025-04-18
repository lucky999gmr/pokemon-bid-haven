
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "@/App";
import { Navbar } from "@/components/Navbar";
import { CreateGameDialog } from "@/components/lobby/CreateGameDialog";
import { JoinGameDialog } from "@/components/lobby/JoinGameDialog";
import { GameList } from "@/components/lobby/GameList";

const Lobby = () => {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
          <div className="flex gap-4">
            <JoinGameDialog />
            <CreateGameDialog />
          </div>
        </div>

        <GameList />
      </div>
    </div>
  );
};

export default Lobby;
