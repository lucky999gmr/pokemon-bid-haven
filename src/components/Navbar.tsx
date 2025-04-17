
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            PokéBid
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/how-to-play">
              <Button variant="ghost">How to Play</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
