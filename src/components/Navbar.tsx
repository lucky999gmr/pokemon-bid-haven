
import { Link } from "react-router-dom";
import { Moon, Sun, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { useContext } from "react";
import { ThemeContext, UserContext } from "@/App";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Navbar = () => {
  const {
    isDarkMode,
    toggleTheme
  } = useContext(ThemeContext);
  const {
    user
  } = useContext(UserContext);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Get initials for avatar from email
  const getInitials = () => {
    if (!user || !user.email) return '';
    
    const emailParts = user.email.split('@');
    const name = emailParts[0];
    return name.substring(0, 2).toUpperCase();
  };

  return <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">PokéBid</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/pokedex" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Pokédex
            </Link>
            <Link to="/how-to-play" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              How to Play
            </Link>
            
            {user && (
              <Link to="/lobby" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Lobby
              </Link>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-500 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="ml-2">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </nav>;
};
