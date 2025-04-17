
import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import { Button } from "./ui/button";

export const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/fd4bec43-e0f8-4a10-8a00-1d26c0e28679.png" 
              alt="PokéBid Logo" 
              className="h-8 w-8 mr-2" 
            />
            <span className="text-xl font-semibold text-gray-900">PokéBid</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/pokedex" className="text-gray-700 hover:text-gray-900">
              Pokédex
            </Link>
            <Link to="/how-to-play" className="text-gray-700 hover:text-gray-900">
              How to Play
            </Link>
            <Link to="/auth" className="text-gray-700 hover:text-gray-900">
              Login
            </Link>
            <Link to="/auth">
              <Button variant="default">Sign Up</Button>
            </Link>
            <Button variant="ghost" size="icon" className="ml-2">
              <Moon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
