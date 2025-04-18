
import { useState, useEffect, useContext } from "react";
import { Navbar } from "@/components/Navbar";
import { UserContext } from "@/App";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Lobby = () => {
  const { user } = useContext(UserContext);
  const [games, setGames] = useState([
    { id: 1, name: "Kanto Cup", players: 2, maxPlayers: 4, status: "Waiting" },
    { id: 2, name: "Johto Masters", players: 3, maxPlayers: 4, status: "In Progress" },
    { id: 3, name: "Elite Four Challenge", players: 1, maxPlayers: 4, status: "Waiting" },
  ]);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Game Lobby</h1>
          <Button className="bg-red-500 hover:bg-red-600">Create New Game</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-xl dark:text-white">{game.name}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Players: {game.players}/{game.maxPlayers}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm dark:text-gray-300">Status: {game.status}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={game.status === "In Progress" ? "secondary" : "default"}
                  disabled={game.status === "In Progress"}
                >
                  {game.status === "In Progress" ? "In Progress" : "Join Game"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
