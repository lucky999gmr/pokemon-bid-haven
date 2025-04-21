
import { useState, useContext, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserContext } from "@/App";
import { useNominationTurns } from "@/hooks/use-nomination-turns";
import Fuse from "fuse.js";

interface PokemonSearchProps {
  gameId: string;
  isMyTurn: boolean;
  currentNominatorId: string | null;
}

type PokemonListEntry = { name: string; url: string };

type Suggestion = {
  name: string;
  id: number;
  sprite: string;
};

export const PokemonSearch = ({ gameId, isMyTurn, currentNominatorId }: PokemonSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useContext(UserContext);
  const { moveToNextNominator } = useNominationTurns(gameId);
  const [pokemonList, setPokemonList] = useState<PokemonListEntry[]>([]);
  const fuseRef = useRef<Fuse<PokemonListEntry>>();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Load list of Pokémon once
  useEffect(() => {
    async function fetchPokemonList() {
      setLoadingList(true);
      try {
        // PokéAPI: get first 1010 Pokémon (Gen 1-9)
        const resp = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1010");
        const data = await resp.json();
        setPokemonList(data.results);
        fuseRef.current = new Fuse(data.results, { threshold: 0.4, keys: ["name"] });
      } catch {
        toast({ title: "Error", description: "Failed to load Pokémon list.", variant: "destructive" });
      }
      setLoadingList(false);
    }
    if (pokemonList.length === 0) fetchPokemonList();
    // eslint-disable-next-line
  }, []);

  // Update suggestions as user types
  useEffect(() => {
    if (!fuseRef.current || !searchTerm.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const raw = fuseRef.current.search(searchTerm.trim()).slice(0, 5);
    if (raw.length === 0) {
      setSuggestions([]);
      setShowDropdown(true);
      return;
    }
    const parsed: Suggestion[] = raw.map(({ item }) => {
      // Extract ID from url, e.g. /pokemon/25/ => 25
      const id = Number(item.url.split("/").filter(Boolean).pop());
      return {
        name: capitalize(item.name),
        id,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      };
    });
    setSuggestions(parsed);
    setShowDropdown(true);
    setActiveIndex(-1);
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setShowDropdown(false);
    };
    if (showDropdown) {
      document.addEventListener("click", handler);
    }
    return () => document.removeEventListener("click", handler);
  }, [showDropdown]);

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    if (!isMyTurn) {
      toast({
        title: "Not Your Turn",
        description: "It's not your turn to nominate a Pokémon.",
        variant: "destructive",
      });
      return;
    }
    setSearchTerm(suggestion.name);
    setSuggestions([]);
    setShowDropdown(false);
    await handleNominatePokemon(suggestion);
  };

  const handleNominatePokemon = async (suggestion?: Suggestion) => {
    try {
      if (!isMyTurn) {
        toast({
          title: "Not Your Turn",
          description: "It's not your turn to nominate a Pokémon.",
          variant: "destructive",
        });
        return;
      }
      setIsSearching(true);

      // If no suggestion given, search for exact or close match
      let target = suggestion;
      if (!target) {
        if (!fuseRef.current) throw new Error("Pokémon list is loading.");
        const raw = fuseRef.current.search(searchTerm.trim()).slice(0, 1);
        if (raw.length === 0) throw new Error("No Pokémon matched your search.");
        const item = raw[0].item;
        const id = Number(item.url.split("/").filter(Boolean).pop());
        target = {
          name: capitalize(item.name),
          id,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        };
      }

      // Prevent duplicate nominations
      const { data: existing, error: existingError } = await supabase
        .from("nominated_pokemon")
        .select("id")
        .eq("game_id", gameId)
        .eq("pokemon_id", target.id)
        .eq("auction_status", "active");
      if (existingError) throw new Error("Error checking nominations.");
      if (existing && existing.length > 0) {
        toast({ title: "Already Nominated", description: "This Pokémon is already up for bidding.", variant: "destructive" });
        setIsSearching(false);
        return;
      }

      // Get current user's player ID
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user?.id)
        .eq("game_id", gameId)
        .single();
      if (playerError || !playerData) throw new Error("Could not retrieve your player info.");

      // Get all players to identify the first bidder
      const { data: allPlayers, error: playersError } = await supabase
        .from("players")
        .select("id, user_id")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true });
      if (playersError || !allPlayers || allPlayers.length === 0) throw new Error("Could not retrieve players.");

      // Find the first bidder (after nominator)
      let firstBidderIndex = allPlayers.findIndex(p => p.id === playerData.id);
      let nextPlayerIndex = (firstBidderIndex + 1) % allPlayers.length;
      const firstBidder = allPlayers[nextPlayerIndex].id;
      const initialBid = 50;

      await supabase.from("nominated_pokemon").insert({
        game_id: gameId,
        pokemon_id: target.id,
        pokemon_name: target.name,
        pokemon_image: target.sprite,
        current_price: initialBid,
        current_bidder_id: user?.id,
        current_turn_player_id: firstBidder,
        last_bid_at: new Date().toISOString(),
        status: "active",
        auction_status: "active",
        time_per_turn: 30,
      });

      moveToNextNominator();
      setSearchTerm("");
      toast({
        title: "Success",
        description: `${target.name} has been nominated with your initial bid of $${initialBid}!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not nominate Pokémon.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(ai => Math.min(ai + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(ai => Math.max(ai - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative bg-[#222222] rounded-lg p-4 shadow mb-6 w-full max-w-sm">
      <h3 className="font-semibold mb-3 text-white">
        {isMyTurn 
          ? "Your Turn: Search and Nominate a Pokémon" 
          : "Waiting for Current Player to Nominate"}
      </h3>
      <div className="flex gap-2 relative">
        <Input
          type="text"
          placeholder={loadingList ? "Loading..." : "Search Pokémon (e.g., Pikachu)"}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="border-gray-700 bg-[#333333] text-white placeholder:text-gray-400"
          disabled={!isMyTurn || loadingList}
          autoComplete="off"
        />
        <Button 
          onClick={() => handleNominatePokemon()}
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={isSearching || !isMyTurn || loadingList}
        >
          {isSearching ? "Nominate..." : "Nominate Pokémon"}
        </Button>

        {/* Suggestions Dropdown */}
        {showDropdown && (searchTerm.length > 0 || suggestions.length > 0) && (
          <div 
            className="absolute left-0 top-12 mt-1 w-full z-50 bg-[#1A1F2C] rounded shadow-lg border border-[#403E43]"
            style={{ minWidth: "220px" }}
          >
            {suggestions.length === 0 && (
              <div className="px-4 py-3 text-gray-400 text-sm select-none">No Pokémon found, try a different spelling.</div>
            )}
            {suggestions.map((sug, i) => (
              <div
                key={sug.id}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[#403E43] ${activeIndex === i ? "bg-[#403E43] text-white" : "text-gray-200"}`}
                onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(sug); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <img src={sug.sprite} alt={sug.name} className="h-6 w-6 mr-2" />
                <span className="flex-1">{sug.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
