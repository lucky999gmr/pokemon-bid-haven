
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserContext } from "@/App";

export const CreateGameDialog = () => {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(UserContext);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, get a game code using RPC
      const { data: code, error: codeError } = await supabase.rpc('generate_game_code');
      
      if (codeError) throw codeError;
      
      // Then create the game with the generated code
      const { error: insertError } = await supabase.from('games').insert({
        name,
        code,
        max_players: parseInt(maxPlayers),
        host_id: user?.id
      });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Game lobby created successfully",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game lobby",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-500 hover:bg-red-600">Create New Game</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateGame} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Lobby Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter lobby name"
              required
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players</Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              max="8"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Game"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
