// src/pages/management/RoundDetailPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { formatCurrency } from '../../utils/helpers';

export default function RoundDetailPage() {
  const { productId, roundId } = useParams();

  const { data: round, isLoading, error } = useQuery({
    queryKey: ['round-detail', roundId],
    queryFn: async () => {
      const res = await axios.get(`/rounds/${roundId}/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading round details...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (error) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Round</h2>
          <p className="text-gray-600">{error.message}</p>
          <Link
            to={`/management/products/${productId}`}
            className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            ← Back to Product
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  const sortedParticipants = [...(round.participants || [])]
    .filter(p => p.payment_status === 'completed')
    .sort((a, b) => (b.pledge_amount || 0) - (a.pledge_amount || 0));

  const highestPledge = sortedParticipants.length > 0 ? sortedParticipants[0].pledge_amount : 0;
  const totalRevenue = (round.participation_fee || 0) * (round.participant_count || 0);
  const averagePledge = sortedParticipants.length > 0
    ? sortedParticipants.reduce((sum, p) => sum + (p.pledge_amount || 0), 0) / sortedParticipants.length
    : 0;

  return (
    <ManagementLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to={`/management/products/${productId}`}
              className="text-blue-600 hover:underline mb-2 inline-flex items-center gap-2 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Product
            </Link>
            <div className="flex items-center gap-4 mt-2">
              <h1 className="text-4xl font-bold text-gray-900">Round {round.round_number}</h1>
              {round.is_active ? (
                <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold animate-pulse">
                  LIVE
                </span>
              ) : (
                <span className="px-4 py-2 bg-gray-500 text-white rounded-full text-sm font-bold">
                  CLOSED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>📊</span> Round Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-semibold mb-1">Entry Fee</p>
              <p className="text-3xl font-bold">{formatCurrency(round.participation_fee)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-semibold mb-1">Min Pledge</p>
              <p className="text-3xl font-bold">{formatCurrency(round.min_pledge)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-semibold mb-1">Max Pledge</p>
              <p className="text-3xl font-bold">{formatCurrency(round.max_pledge)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-semibold mb-1">Participants</p>
              <p className="text-3xl font-bold">{round.participant_count || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-semibold mb-1">Total Bids</p>
              <p className="text-3xl font-bold">{round.bid_count || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-semibold mb-1">Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Highest Pledge</h3>
              <span className="text-3xl">🏆</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {highestPledge > 0 ? formatCurrency(highestPledge) : 'No bids'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Average Pledge</h3>
              <span className="text-3xl">📈</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(averagePledge)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Duration</h3>
              <span className="text-3xl">⏰</span>
            </div>
            <p className="text-lg font-semibold text-gray-700">
              {new Date(round.start_time).toLocaleDateString()} - {new Date(round.end_time).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Participants Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>👥</span> Participants Leaderboard ({sortedParticipants.length})
            </h2>
          </div>

          <div className="p-6">
            {sortedParticipants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Full Name</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Username</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Age</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Pledge Amount</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParticipants.map((participant, index) => {
                      const user = participant.user || {};
                      const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
                      const username = user.username || 'Unknown';
                      const phone = user.phone_number || '-';
                      const email = user.email || '-';
                      const age = user.age ?? '-';
                      const pledge = participant.pledge_amount ?? 0;

                      return (
                        <tr
                          key={participant.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                            index === 0 ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            {index === 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-3xl">🏆</span>
                                <span className="font-bold text-xl text-yellow-600">#1</span>
                              </div>
                            ) : index === 1 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">🥈</span>
                                <span className="font-semibold text-lg text-gray-500">#2</span>
                              </div>
                            ) : index === 2 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">🥉</span>
                                <span className="font-semibold text-lg text-gray-500">#3</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-600 text-lg">#{index + 1}</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900 text-lg">{fullName}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-600">@{username}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">{email}</div>
                              <div className="text-gray-500">{phone}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-600">{age}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={`font-bold text-xl ${
                              index === 0 ? 'text-green-600' :
                              index === 1 ? 'text-blue-600' :
                              index === 2 ? 'text-orange-600' :
                              'text-gray-900'
                            }`}>
                              {formatCurrency(pledge)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Participants Yet</h3>
                <p className="text-gray-600">This round hasn't received any participants yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Round Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>ℹ️</span> Round Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-semibold mb-1">Round ID</p>
              <p className="text-gray-900 font-mono text-xs">{round.id}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">Base Price</p>
              <p className="text-gray-900 font-bold">{formatCurrency(round.base_price)}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">Start Time</p>
              <p className="text-gray-900">{new Date(round.start_time).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">End Time</p>
              <p className="text-gray-900">{new Date(round.end_time).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">Status</p>
              <p className="text-gray-900 font-bold">{round.is_active ? '🟢 Active' : '🔴 Closed'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">Is Open for Bids</p>
              <p className="text-gray-900 font-bold">{round.is_open ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
