import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Target, ListChecks, Book } from "lucide-react";
import { useContext } from "react";
import { UserContext } from "@/App";
const Index = () => {
  const {
    user
  } = useContext(UserContext);
  return <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-pink-400 mb-8">
            Welcome to PokéBid
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-12">
            Bid on your favorite Pokémon in an exciting turn-based auction system. Collect,
            compete, and become the ultimate Pokémon collector!
          </p>
          <div className="flex justify-center gap-4 mb-20">
            {user ? <Link to="/pokedex">
                <Button className="bg-red-500 hover:bg-red-600 text-lg px-8 py-6 h-auto">
                  Explore Pokédex
                </Button>
              </Link> : <Link to="/auth">
                <Button className="bg-red-500 hover:bg-red-600 text-lg px-8 py-6 h-auto rounded-2xl">
                  Get Started
                </Button>
              </Link>}
            {!user && <Link to="/auth">
                
              </Link>}
            <Link to="/how-to-play">
              <Button variant="outline" className="text-lg px-8 py-6 h-auto dark:border-gray-700 dark:text-white rounded-2xl">
                How to Play
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <FeatureCard icon={<Target className="w-12 h-12 text-red-500" />} title="Turn-Based Bidding" description="Take turns bidding on Pokémon in a strategic auction system where timing is key." borderColor="border-t-red-500" />
            <FeatureCard icon={<ListChecks className="w-12 h-12 text-blue-500" />} title="Collection Tracking" description="Build and showcase your Pokémon collection with detailed stats and sorting options." borderColor="border-t-blue-500" />
            <FeatureCard icon={<Book className="w-12 h-12 text-green-500" />} title="Pokédex" description="Access comprehensive information about all Pokémon species, including stats, types, and evolution chains." borderColor="border-t-green-500" />
          </div>
        </div>
      </main>
    </div>;
};
const FeatureCard = ({
  icon,
  title,
  description,
  borderColor
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  borderColor: string;
}) => <div className={`bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border-t-4 ${borderColor}`}>
    <div className="flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  </div>;
export default Index;