import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createContext } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Pokedex from "./pages/Pokedex";
import HowToPlay from "./pages/HowToPlay";
import Lobby from "./pages/Lobby";
import Profile from "./pages/Profile";
import { supabase } from "./integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import BiddingArena from "./pages/BiddingArena";

export const ThemeContext = createContext({ 
  isDarkMode: false, 
  toggleTheme: () => {} 
});

export const UserContext = createContext<{ user: User | null; }>({ 
  user: null 
});

const queryClient = new QueryClient();

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <UserContext.Provider value={{ user }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pokedex" element={<Pokedex />} />
                <Route path="/how-to-play" element={<HowToPlay />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/arena/:gameId" element={<BiddingArena />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
