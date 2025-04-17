
import { Navbar } from "@/components/Navbar";

const HowToPlay = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4f8] to-[#d9e4f5] dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-pink-400 mb-8">How to Play PokéBid</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Game Rules</h2>
              <p className="text-gray-700 dark:text-gray-300">
                PokéBid is a turn-based auction game where players bid on their favorite Pokémon. Here's how it works:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Each auction features a Pokémon with a starting bid amount.</li>
                <li>Players take turns placing bids in clockwise order.</li>
                <li>Each bid must be higher than the previous bid by at least the minimum increment.</li>
                <li>Pass your turn if you don't want to bid, but you can't re-enter that auction.</li>
                <li>The auction ends when all players except one have passed.</li>
                <li>The highest bidder pays their bid amount and adds the Pokémon to their collection.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Getting Started</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Create an account or log in to your existing account.</li>
                <li>Browse the available Pokémon in the Pokédex.</li>
                <li>Join an auction room or create your own.</li>
                <li>Invite friends to join your auction room.</li>
                <li>Start bidding and build your ultimate Pokémon collection!</li>
              </ol>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Tips for Success</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Research Pokémon in the Pokédex before bidding to understand their value.</li>
                <li>Manage your budget carefully - don't spend all your points on one Pokémon!</li>
                <li>Pay attention to Pokémon types and stats to build a balanced collection.</li>
                <li>Sometimes it's better to pass on a high-value Pokémon if the bidding gets too competitive.</li>
                <li>Complete daily challenges to earn bonus points for bidding.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;
