
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to PokéBid Haven
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your premier destination for trading rare Pokémon cards
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <FeatureCard
              title="Discover"
              description="Browse through our extensive collection of rare Pokémon cards"
            />
            <FeatureCard
              title="Bid"
              description="Participate in exciting auctions for your favorite Pokémon"
            />
            <FeatureCard
              title="Trade"
              description="Build your collection by trading with other enthusiasts"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Index;
