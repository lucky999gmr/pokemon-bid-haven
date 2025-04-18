import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import debounce from "lodash/debounce";
import { Navbar } from "@/components/Navbar";
import { useContext } from "react";
import { ThemeContext } from "@/App";

interface Pokemon {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  sprites: {
    front_default: string;
    front_shiny: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

const generations = [
  { gen: 1, start: 1, end: 151 },
  { gen: 2, start: 152, end: 251 },
  { gen: 3, start: 252, end: 386 },
  { gen: 4, start: 387, end: 493 },
  { gen: 5, start: 494, end: 649 },
  { gen: 6, start: 650, end: 721 },
  { gen: 7, start: 722, end: 809 },
  { gen: 8, start: 810, end: 905 },
  { gen: 9, start: 906, end: 1010 },
];

const Pokedex = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentGen, setCurrentGen] = useState(1);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [nominated] = useState(new Set<number>());
  
  // Store all Pokemon for the current generation
  const [allPokemonByGen, setAllPokemonByGen] = useState<Map<number, Pokemon[]>>(new Map());
  
  // Cache for fetched Pokemon
  const pokemonCache = new Map<string, Pokemon>();

  const fetchPokemon = async (id: number) => {
    if (pokemonCache.has(String(id))) {
      return pokemonCache.get(String(id));
    }
    
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    pokemonCache.set(String(id), data);
    return data;
  };

  // Load initial Pokemon data for the current generation
  const loadPokemon = async (gen: number, resetOffset = true) => {
    setLoading(true);
    const genData = generations[gen - 1];
    const newOffset = resetOffset ? 0 : offset;
    const start = genData.start + newOffset;
    const end = Math.min(start + 19, genData.end);
    
    try {
      const promises = [];
      for (let i = start; i <= end; i++) {
        promises.push(fetchPokemon(i));
      }
      const results = await Promise.all(promises);
      
      const newPokemon = resetOffset ? results : [...pokemon, ...results];
      setPokemon(newPokemon);
      
      // Add to the generation-specific cache
      const currentGenPokemon = allPokemonByGen.get(gen) || [];
      const updatedGenPokemon = [...currentGenPokemon, ...results.filter(p => 
        !currentGenPokemon.some(cp => cp.id === p.id)
      )];
      
      const newPokemonByGen = new Map(allPokemonByGen);
      newPokemonByGen.set(gen, updatedGenPokemon);
      setAllPokemonByGen(newPokemonByGen);
      
      setOffset(resetOffset ? 20 : offset + 20);
    } catch (error) {
      console.error("Error fetching Pokemon:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search through all loaded Pokemon across all generations
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      // If search is cleared, show the current generation
      const genPokemon = allPokemonByGen.get(currentGen) || [];
      setPokemon(genPokemon.slice(0, Math.min(offset, genPokemon.length)));
      return;
    }
    
    setLoading(true);
    
    try {
      let results: Pokemon[] = [];
      
      // Check if it's a name or ID search
      const isIdSearch = !isNaN(Number(term));
      
      if (isIdSearch) {
        // Try to fetch by ID directly
        const id = Number(term);
        try {
          const pokemon = await fetchPokemon(id);
          results = [pokemon];
        } catch (error) {
          console.error(`Pokemon with ID ${id} not found`);
        }
      } else {
        // Name search - search all cached Pokemon across all generations
        const lowercaseTerm = term.toLowerCase();
        
        for (const [, genPokemon] of allPokemonByGen) {
          const matchingPokemon = genPokemon.filter(p => 
            p.name.toLowerCase().includes(lowercaseTerm)
          );
          results = [...results, ...matchingPokemon];
        }
        
        // If we haven't found any matching Pokemon and there might be more to load
        if (results.length === 0) {
          // Try to fetch by name directly from API
          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${lowercaseTerm}`);
            if (response.ok) {
              const data = await response.json();
              results = [data];
              // Add to cache
              pokemonCache.set(String(data.id), data);
            }
          } catch (error) {
            console.error(`Error searching for ${term}:`, error);
          }
        }
      }
      
      setPokemon(results);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
    }
  }, [allPokemonByGen, currentGen, offset]);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      performSearch(term);
    }, 300),
    [performSearch]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Initial load
  useEffect(() => {
    loadPokemon(1);
  }, []);

  const handleNominate = (id: number) => {
    if (nominated.has(id)) {
      return;
    }
    nominated.add(id);
    alert(`Pokemon #${id} has been nominated!`);
  };

  // When changing generation
  const changeGeneration = (gen: number) => {
    setCurrentGen(gen);
    setSearchTerm(""); // Clear search
    
    // If we already have Pokemon for this generation, use them
    const genPokemon = allPokemonByGen.get(gen);
    if (genPokemon && genPokemon.length > 0) {
      setPokemon(genPokemon.slice(0, 20));
      setOffset(20);
    } else {
      // Otherwise load from API
      loadPokemon(gen);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode 
      ? "bg-gradient-to-b from-gray-900 to-gray-800" 
      : "bg-gradient-to-b from-[#f0f4f8] to-[#d9e4f5]"}`}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Pokédex</h1>
        
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md mx-auto dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {generations.map(({ gen }) => (
            <Button
              key={gen}
              onClick={() => changeGeneration(gen)}
              variant={currentGen === gen ? "default" : "outline"}
              className={currentGen === gen ? "bg-red-500 hover:bg-red-600" : "dark:text-white dark:border-gray-700"}
            >
              Gen {gen}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 dark:text-white">Loading Pokémon...</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {pokemon.map((p) => (
            <div
              key={p.id}
              className={`${isDarkMode 
                ? "bg-gradient-to-b from-gray-800 to-gray-900" 
                : "bg-gradient-to-b from-white to-[#f9f9f9]"} 
                rounded-[15px] p-4 shadow-sm hover:shadow-md hover:scale-105 transition-all relative cursor-pointer`}
              onClick={() => {
                const buttons = document.querySelectorAll('.nominate-button');
                buttons.forEach(btn => {
                  if (btn.getAttribute('data-id') !== String(p.id)) {
                    btn.classList.add('hidden');
                  }
                });
                document.querySelector(`[data-id="${p.id}"]`)?.classList.remove('hidden');
              }}
            >
              <img
                src={p.sprites.other['official-artwork'].front_default || 
                     p.sprites.front_default || 
                     p.sprites.front_shiny}
                alt={p.name}
                className="w-32 h-32 mx-auto"
              />
              <div className="text-center mt-2">
                <h3 className="text-lg font-semibold capitalize dark:text-white">
                  {p.name} #{p.id}
                </h3>
                <div className="flex gap-2 justify-center mt-1 flex-wrap">
                  {p.types.map(({ type }) => (
                    <span
                      key={type.name}
                      className="px-2 py-1 rounded text-xs text-white bg-blue-500"
                    >
                      {type.name}
                    </span>
                  ))}
                </div>
                <div className="mt-2 dark:text-gray-300">
                  HP: {p.stats.find(s => s.stat.name === 'hp')?.base_stat}
                </div>
                <Button
                  className={`nominate-button hidden mt-2 bg-red-500 hover:bg-red-600 ${
                    nominated.has(p.id) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  data-id={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNominate(p.id);
                  }}
                  disabled={nominated.has(p.id)}
                >
                  Nominate
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!searchTerm && offset + generations[currentGen - 1].start <= generations[currentGen - 1].end && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => loadPokemon(currentGen, false)}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pokedex;
