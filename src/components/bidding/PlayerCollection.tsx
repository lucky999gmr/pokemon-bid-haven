
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Add ref for imperative refresh
export interface PokemonCollectionItem {
  id: string;
  pokemon_name: string;
  pokemon_image: string;
  acquisition_price: number;
}

export interface PlayerCollectionRef {
  refreshCollection: () => void;
}

export const PlayerCollection = forwardRef<PlayerCollectionRef, { playerId: string }>(({ playerId }, ref) => {
  const [collection, setCollection] = useState<PokemonCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Allow parent to call refreshCollection() via ref
  useImperativeHandle(ref, () => ({
    refreshCollection: () => {
      fetchCollection();
    }
  }));

  const fetchCollection = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("player_collections")
      .select("*")
      .eq("player_id", playerId);

    if (error) {
      console.error("Error fetching collection:", error);
    } else if (data) {
      const formattedData: PokemonCollectionItem[] = data.map(item => ({
        id: item.id,
        pokemon_name: item.pokemon_name,
        pokemon_image: item.pokemon_image,
        acquisition_price: item.acquisition_price
      }));
      setCollection(formattedData);
    }
    setLoading(false);
  };

  // Set up realtime subscription for collection updates
  useEffect(() => {
    fetchCollection();
    
    const channel = supabase
      .channel(`collection-updates:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_collections',
          filter: `player_id=eq.${playerId}`
        },
        () => {
          fetchCollection();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="text-blue-500 hover:text-blue-600 text-xs font-medium bg-white px-3 py-1 rounded shadow"
        >
          My Collection ({collection.length})
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My Pokémon Collection</DialogTitle>
          <DialogDescription>
            Pokémon you've won in auctions will appear here
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">Loading collection...</div>
        ) : collection.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No Pokémon in collection yet
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-3 gap-3">
              {collection.map((item) => (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-gray-100 p-2 rounded-lg flex flex-col items-center">
                        <img 
                          src={item.pokemon_image} 
                          alt={item.pokemon_name}
                          className="w-16 h-16 object-contain" 
                        />
                        <span className="text-xs mt-1 capitalize truncate w-full text-center">
                          {item.pokemon_name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{item.pokemon_name}</p>
                      <p className="text-xs text-gray-500">
                        Acquired for ${item.acquisition_price}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
});

PlayerCollection.displayName = "PlayerCollection";
