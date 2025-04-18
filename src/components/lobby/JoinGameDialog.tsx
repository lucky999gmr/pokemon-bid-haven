
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

export const JoinGameDialog = () => {
  const [code, setCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(UserContext);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: game } = await supabase
        .from('games')
        .select('id, max_players')
        .eq('code', code)
        .eq('status', 'waiting')
        .single();

      if (!game) {
        throw new Error("Game not found or already started");
      }

      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact' })
        .eq('game_id', game.id);

      if (count && count >= game.max_players) {
        throw new Error("Game is full");
      }

      // Insert a new player record with the user_id
      const { error } = await supabase.from('players').insert({ 
        game_id: game.id,
        user_id: user?.id
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Joined game successfully",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join game",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="dark:border-gray-600 dark:text-white">
          Join Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Join Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleJoinGame} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Game Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 4-digit code"
              maxLength={4}
              pattern="[0-9]{4}"
              required
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Joining..." : "Join Game"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
