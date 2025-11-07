import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import './RightSidebar.css';

export default function RightSidebar() {
  const [activeModal, setActiveModal] = useState(null);

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

  const helpModals = {
    'help-center': {
      title: 'Help Center',
      icon: '📚',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Welcome to BidSoko Help Center!</p>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Getting Started</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Create a free account to start buying and bidding</li>
              <li>Browse our wide range of products</li>
              <li>Choose to buy instantly or bid to save up to 70%</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Need More Help?</h4>
            <p className="text-sm text-gray-600">Call us at <a href="tel:0711011011" className="text-orange-600 font-semibold">0711 011 011</a></p>
            <p className="text-sm text-gray-600">Email: <a href="mailto:support@bidsoko.com" className="text-orange-600">support@bidsoko.com</a></p>
          </div>
        </div>
      )
    },
    'how-to-buy': {
      title: 'How to Buy',
      icon: '🛒',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Browse Products</h4>
                <p className="text-sm text-gray-600">Find products marked with "Buy Now" option</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Add to Cart</h4>
                <p className="text-sm text-gray-600">Click "Add to Cart" or "Buy Now" button</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Checkout</h4>
                <p className="text-sm text-gray-600">Enter delivery details and make payment via M-Pesa</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Get Your Order</h4>
                <p className="text-sm text-gray-600">We'll deliver to your doorstep!</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'how-to-bid': {
      title: 'How to Bid',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">Save up to 70% by bidding instead of buying!</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Find Auction Products</h4>
                <p className="text-sm text-gray-600">Look for products marked with "Auction" or "Both"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Pay Participation Fee</h4>
                <p className="text-sm text-gray-600">Small fee to join the auction (varies by product)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Place Your Bids</h4>
                <p className="text-sm text-gray-600">Bid higher than current highest bid to stay in the lead</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Win & Pay</h4>
                <p className="text-sm text-gray-600">If you win, pay your final bid amount to get the product!</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'payment-options': {
      title: 'Payment Options',
      icon: '💳',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">We currently accept the following payment method:</p>
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center text-2xl">📱</div>
              <div>
                <h4 className="font-semibold text-gray-900">M-Pesa STK Push</h4>
                <p className="text-sm text-gray-600">Instant & Secure</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-15">
              <li>✓ Direct M-Pesa payment</li>
              <li>✓ You'll receive an STK push on your phone</li>
              <li>✓ Enter your M-Pesa PIN to complete</li>
              <li>✓ Instant confirmation</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">💡 <strong>Tip:</strong> Make sure you have sufficient M-Pesa balance before checkout</p>
          </div>
        </div>
      )
    },
    'track-delivery': {
      title: 'Track Delivery',
      icon: '🚚',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">Track your order status anytime:</p>
          <div className="space-y-3">
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Pending</h4>
              <p className="text-sm text-gray-600">Order received, payment being processed</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Processing</h4>
              <p className="text-sm text-gray-600">Order confirmed, being prepared for shipment</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Shipped</h4>
              <p className="text-sm text-gray-600">On the way to your delivery address</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">Delivered</h4>
              <p className="text-sm text-gray-600">Package successfully delivered!</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700"><strong>View your orders:</strong> Go to <span className="text-orange-600 font-semibold">Dashboard → Purchase History</span></p>
          </div>
        </div>
      )
    },
    'returns-refunds': {
      title: 'Returns & Refunds',
      icon: '↩️',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800 font-medium">We want you to be 100% satisfied with your purchase!</p>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Return Policy</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>7-day return policy for most products</li>
                <li>Product must be unused and in original packaging</li>
                <li>Keep your receipt/order number</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Refund Process</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Contact us at 0711 011 011</li>
                <li>Provide order number and reason for return</li>
                <li>Refund processed within 5-7 business days</li>
                <li>Money refunded via M-Pesa</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700"><strong>Questions?</strong> Contact support at <a href="mailto:support@bidsoko.com" className="text-orange-600">support@bidsoko.com</a></p>
          </div>
        </div>
      )
    }
  };

  return (
    <>
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
              <button onClick={() => setActiveModal('help-center')} className="text-blue-600 hover:underline text-left">Help Center</button>
            </li>
            <li>
              <button onClick={() => setActiveModal('how-to-buy')} className="text-blue-600 hover:underline text-left">How to Buy</button>
            </li>
            <li>
              <button onClick={() => setActiveModal('how-to-bid')} className="text-blue-600 hover:underline text-left">How to Bid</button>
            </li>
            <li>
              <button onClick={() => setActiveModal('payment-options')} className="text-blue-600 hover:underline text-left">Payment Options</button>
            </li>
            <li>
              <button onClick={() => setActiveModal('track-delivery')} className="text-blue-600 hover:underline text-left">Track Delivery</button>
            </li>
            <li>
              <button onClick={() => setActiveModal('returns-refunds')} className="text-blue-600 hover:underline text-left">Returns & Refunds</button>
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

      {/* Help Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{helpModals[activeModal].icon}</span>
                <h2 className="text-2xl font-bold">{helpModals[activeModal].title}</h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {helpModals[activeModal].content}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button onClick={() => setActiveModal(null)} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
