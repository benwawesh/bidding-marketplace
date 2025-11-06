import { formatCurrency } from '../utils/helpers';

export default function Leaderboard({ leaderboardData, currentUserId }) {
  if (!leaderboardData || !leaderboardData.top_bids) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Leaderboard</h3>
        <p className="text-gray-500 text-center py-8">No bids yet. Be the first!</p>
      </div>
    );
  }

  const { top_bids, total_participants, user_position, user_bid, user_in_top_10, tied_at_top_count } = leaderboardData;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">🏆 Top 10 Leaderboard</h3>
      </div>

      {/* Tied at top notice */}
      {tied_at_top_count > 10 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-800">
            <strong>{tied_at_top_count}</strong> users tied at highest amount. 
            Names rotate randomly. Winner will be selected randomly at round close.
          </p>
        </div>
      )}

      {/* User's position (if not in top 10) */}
      {user_bid && !user_in_top_10 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Your Position</p>
              <p className="text-2xl font-bold text-blue-900">#{user_position}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Your Pledge</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(user_bid.pledge_amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 List */}
      <div className="space-y-2">
        {top_bids.map((bid, index) => (
          <div
            key={bid.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              bid.is_current_user
                ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-400'
                : index === 0
                ? 'bg-yellow-50 border border-yellow-300'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {/* Position & User */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  index === 0
                    ? 'bg-yellow-400 text-yellow-900'
                    : index === 1
                    ? 'bg-gray-300 text-gray-800'
                    : index === 2
                    ? 'bg-orange-300 text-orange-900'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {bid.position}
              </div>
              <div>
                <p className={`font-semibold ${bid.is_current_user ? 'text-orange-900' : 'text-gray-900'}`}>
                  {bid.is_current_user ? 'You' : bid.user.first_name}
                  {index === 0 && ' 👑'}
                </p>
                {bid.is_current_user && (
                  <p className="text-xs text-orange-700">Your bid</p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`text-lg font-bold ${bid.is_current_user ? 'text-orange-900' : 'text-gray-900'}`}>
                {formatCurrency(bid.pledge_amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Live updates
      </div>
    </div>
  );
}
