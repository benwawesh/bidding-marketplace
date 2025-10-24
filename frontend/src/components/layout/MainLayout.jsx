import PromoBar from "./PromoBar";
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="bg-rose-100 min-h-screen flex flex-col">
      {/* Top Promo Bar */}
      <PromoBar />

      {/* Navbar */}
      <Navbar />

      {/* Promo Banner Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          🎯 <strong>HYBRID MARKETPLACE:</strong> Buy Instantly OR Bid to Save up to 70% | 
          <a href="#browse" className="underline font-bold ml-1">EXPLORE NOW</a>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
