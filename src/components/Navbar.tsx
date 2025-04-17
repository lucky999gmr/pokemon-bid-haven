
import { Link } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useContext } from "react";
import { ThemeContext, UserContext } from "@/App";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const Navbar = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/fd4bec43-e0f8-4a10-8a00-1d26c0e28679.png" 
              alt="PokéBid Logo" 
              className="h-8 w-8 mr-2" 
            />
            <span className="text-xl font-semibold text-gray-900 dark:text-white">PokéBid</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/pokedex" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Pokédex
            </Link>
            <Link to="/how-to-play" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              How to Play
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 dark:text-gray-300">
                  {user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Login
                </Link>
                <Link to="/auth">
                  <Button variant="default">Sign Up</Button>
                </Link>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="ml-2"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
