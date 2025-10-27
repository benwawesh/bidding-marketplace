// src/pages/management/WinnerCalculationPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { formatCurrency } from '../../utils/helpers';

export default function WinnerCalculationPage() {
  const { productId } = useParams();

  const { data: calculation, isLoading, error } = useQuery({
    queryKey: ['winner-calculation', productId],
    queryFn: async () => {
      const res = await axios.get(`/auctions/${productId}/winner_calculation/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Calculating winner...</p>
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
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Calculation</h2>
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

  if (!calculation || calculation.total_rounds === 0) {
    return (
      <ManagementLayout>
        <div className="max-w-7xl mx-auto p-6">
          <Link
            to={`/management/products/${productId}`}
            className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Product
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center mt-6">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Rounds Created Yet</h3>
            <p className="text-gray-600">Create rounds to calculate the winner</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  const { auction, total_rounds, total_participants, winner, all_participants } = calculation;

  return (
    <ManagementLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
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
          <h1 className="text-4xl font-bold text-gray-900 mt-2">Winner Calculation</h1>
          <p className="text-gray-600 mt-2">{auction.title}</p>
        </div>

        {/* Calculation Method Explanation */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span>ℹ️</span> How Winner is Calculated
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>• Each user's <strong>average pledge</strong> is calculated across <strong>ALL {total_rounds} rounds</strong></p>
            <p>• If a user didn't participate in a round, their pledge for that round is <strong>KES 0</strong></p>
            <p>• Formula: <code className="bg-blue-100 px-2 py-1 rounded">Average = (Total Pledges) ÷ {total_rounds} rounds</code></p>
            <p>• User with the <strong>highest average pledge wins</strong> 🏆</p>
          </div>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl shadow-2xl p-8 text-white">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold mb-2">WINNER</h2>
              <h3 className="text-3xl font-bold mb-4">{winner.user.full_name || winner.user.username}</h3>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 inline-block">
                <p className="text-yellow-100 text-sm font-semibold mb-1">Average Pledge</p>
                <p className="text-5xl font-bold">{formatCurrency(winner.average_pledge)}</p>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-yellow-100 text-xs font-semibold mb-1">Total Pledged</p>
                  <p className="text-2xl font-bold">{formatCurrency(winner.total_pledge)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-yellow-100 text-xs font-semibold mb-1">Rounds Participated</p>
                  <p className="text-2xl font-bold">{winner.rounds_participated} / {total_rounds}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-yellow-100 text-xs font-semibold mb-1">Contact</p>
                  <p className="text-sm font-semibold truncate">{winner.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Participants Ranking */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>📊</span> Complete Rankings ({total_participants} Participants)
            </h2>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Participant</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Participated In</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Total Pledged</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Average Pledge</th>
                  </tr>
                </thead>
                <tbody>
                  {all_participants.map((participant, index) => (
                    <tr
                      key={participant.user.id}
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
                        <div>
                          <p className="font-semibold text-gray-900">
                            {participant.user.full_name || participant.user.username}
                          </p>
                          <p className="text-sm text-gray-500">@{participant.user.username}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          <div>{participant.user.email}</div>
                          <div className="text-gray-500">{participant.user.phone_number || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {participant.rounds_participated} / {total_rounds} rounds
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-lg text-gray-900">
                          {formatCurrency(participant.total_pledge)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-bold text-xl ${
                          index === 0 ? 'text-green-600' :
                          index === 1 ? 'text-blue-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {formatCurrency(participant.average_pledge)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown for Each Participant */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Detailed Round-by-Round Breakdown</h2>

          {all_participants.map((participant, index) => (
            <details
              key={participant.user.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              open={index === 0}
            >
              <summary className="cursor-pointer p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {participant.user.full_name || participant.user.username}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Average: {formatCurrency(participant.average_pledge)} |
                        Participated in {participant.rounds_participated} of {total_rounds} rounds
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Pledged</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(participant.total_pledge)}
                    </p>
                  </div>
                </div>
              </summary>

              <div className="p-6 bg-gray-50 border-t">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {participant.round_details.map((round) => (
                    <div
                      key={round.round_number}
                      className={`p-4 rounded-lg border-2 ${
                        round.participated
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Round {round.round_number}
                      </p>
                      <p className={`text-lg font-bold ${
                        round.participated ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {formatCurrency(round.pledge_amount)}
                      </p>
                      <p className="text-xs mt-1">
                        {round.participated ? (
                          <span className="text-green-600">✓ Participated</span>
                        ) : (
                          <span className="text-gray-500">✗ Not joined</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </ManagementLayout>
  );
}
