export const EcosystemHighlights = () => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Ecosystem Highlights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Donation Campaigns</span><i className="fa-solid fa-hand-holding-heart text-[rgb(105,65,198)]"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">"Build School Fund" – 85% goal reached</p>
          <div className="mt-3 rounded-full h-2 overflow-hidden bg-gray-200 dark:bg-gray-700"><div className="h-2 w-[85%] bg-[rgb(105,65,198)]"></div></div>
        </div>

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Lì xì</span><i className="fa-solid fa-gift text-red-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">32 envelopes active • 120k đồng total</p>
        </div>

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Stake</span><i className="fa-solid fa-seedling text-green-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">8,420 MZD staked • 12.5% APY</p>
        </div>

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Swap</span><i className="fa-solid fa-right-left text-blue-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">24h volume: 14,200 MZD</p>
        </div>

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Cobar.vn</span><i className="fa-solid fa-store text-orange-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Integrated Mezon payment marketplace</p>
        </div>

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Mezon Games</span><i className="fa-solid fa-gamepad text-pink-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">5 active titles • 340 players online</p>
        </div>

        <div className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Give Coffee</span><i className="fa-solid fa-mug-saucer text-yellow-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">12,543 cups sent (on-chain + payment)</p>
        </div>
      </div>
    </section>
  );
};
