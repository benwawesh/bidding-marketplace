import { MessageCircle } from 'lucide-react';
import './RightSidebar.css';

export default function RightSidebar() {
  const offers = [
    { 
      id: 1, 
      emoji: '🎯', 
      text: 'Join the bid TODAY and get CRAZY OFFERS!',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    { 
      id: 2, 
      emoji: '🔥', 
      text: 'Bid now and SAVE UP TO 100%!',
      bgColor: 'bg-gradient-to-r from-red-500 to-orange-500'
    },
    { 
      id: 3, 
      emoji: '⚡', 
      text: 'LIMITED TIME: Extra 10% off on bids!',
      bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-400'
    },
    { 
      id: 4, 
      emoji: '🎁', 
      text: 'First bid? Get KSH 500 OFF!',
      bgColor: 'bg-gradient-to-r from-green-500 to-teal-500'
    },
    { 
      id: 5, 
      emoji: '💰', 
      text: 'Daily deals - Bid and WIN BIG!',
      bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500'
    },
    { 
      id: 6, 
      emoji: '🎊', 
      text: 'Beat the price - Bid smarter, save more!',
      bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500'
    },
  ];

  return (
    <aside className="w-80 space-y-4">
      
      {/* ANIMATED OFFERS SECTION */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg p-6 overflow-hidden relative">
        <h3 className="text-lg font-bold text-white mb-4 text-center drop-shadow-md">
          🎉 Special Offers
        </h3>
        
        <div className="offers-flash-container h-32 relative rounded-lg overflow-hidden">
          {offers.map((offer, index) => (
            <div 
              key={offer.id} 
              className={`offer-flash-slide ${offer.bgColor}`}
              style={{
                animationDelay: `${index * 2}s`
              }}
            >
              <div className="text-center">
                <span className="text-4xl mb-2 block drop-shadow-lg">{offer.emoji}</span>
                <p className="text-sm font-bold text-white px-3 drop-shadow-md">
                  {offer.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="bg-white text-orange-600 px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-100 transition shadow-lg">
            Explore Offers →
          </button>
        </div>
      </div>

      {/* WHATSAPP SUPPORT */}
      <div className="bg-green-500 text-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <MessageCircle className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg">WhatsApp</h3>
            <p className="text-sm text-green-100">Quick support</p>
          </div>
        </div>
        <button className="w-full bg-white text-green-600 py-2 rounded font-semibold hover:bg-green-50 transition">
          CHAT NOW
        </button>
      </div>

      {/* NEED HELP SECTION */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">NEED HELP?</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="#help" className="text-blue-600 hover:underline">Help Center</a>
          </li>
          <li>
            <a href="#buy" className="text-blue-600 hover:underline">How to Buy</a>
          </li>
          <li>
            <a href="#bid" className="text-blue-600 hover:underline">How to Bid</a>
          </li>
          <li>
            <a href="#payment" className="text-blue-600 hover:underline">Payment Options</a>
          </li>
          <li>
            <a href="#delivery" className="text-blue-600 hover:underline">Track Delivery</a>
          </li>
          <li>
            <a href="#returns" className="text-blue-600 hover:underline">Returns & Refunds</a>
          </li>
        </ul>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Call us:</p>
          <a href="tel:0711011011" className="text-orange-600 font-bold text-lg hover:text-orange-700">
            0711 011 011
          </a>
        </div>
      </div>

    </aside>
  );
}
