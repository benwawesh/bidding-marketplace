import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';

export default function PaymentModal({ auctionId, roundId, amount, onSuccess, onClose }) {
  const [transactionId, setTransactionId] = useState('');

  const paymentMutation = useMutation({
    mutationFn: async () => {
      // Create participation record
      const response = await axios.post('/participations/', {
        auction: auctionId,
        round: roundId,
        fee_paid: amount,
        payment_status: 'completed', // Mock payment - in production, integrate M-Pesa
      });
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert('Payment failed: ' + (error.response?.data?.error || error.message));
    },
  });

  const handlePayment = (e) => {
    e.preventDefault();
    
    if (!transactionId.trim()) {
      alert('Please enter a transaction ID');
      return;
    }

    paymentMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Auction</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Pay the entry fee to start bidding in this auction.
          </p>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(amount)}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">📱 M-Pesa Payment</p>
            <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Go to M-Pesa on your phone</li>
              <li>Select Lipa Na M-Pesa → Paybill</li>
              <li>Enter Business Number: <strong>123456</strong></li>
              <li>Account: <strong>AUCTION-{auctionId.slice(0, 8)}</strong></li>
              <li>Amount: <strong>{amount}</strong></li>
              <li>Enter your M-Pesa PIN and confirm</li>
              <li>Enter the M-Pesa code below</li>
            </ol>
          </div>

          <form onSubmit={handlePayment}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M-Pesa Transaction Code
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., QK12ABC34D"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the confirmation code you received via SMS
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={paymentMutation.isPending}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:bg-gray-400"
              >
                {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
