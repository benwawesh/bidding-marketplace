// src/pages/management/RoundDetailPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { formatCurrency } from '../../utils/helpers';

export default function RoundDetailPage() {
  const { roundId } = useParams(); // ✅ removed productId

  // Fetch round details directly
  const { data: round, isLoading, error } = useQuery({
    queryKey: ['round-detail', roundId],
    queryFn: async () => {
      const res = await axios.get(`/rounds/${roundId}/`); // ✅ changed endpoint
      return res.data;
    },
  });

  if (isLoading)
    return (
      <ManagementLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading round details...</p>
          </div>
        </div>
      </ManagementLayout>
    );

  if (error)
    return (
      <ManagementLayout>
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-bold mb-2">Error loading round</h2>
          <p>{error.message}</p>
        </div>
      </ManagementLayout>
    );

  const participants = round?.participants || [];
  const totalPledge = participants.reduce((acc, p) => acc + (p.pledge_amount || 0), 0);
  const highestPledge = participants.length ? Math.max(...participants.map(p => p.pledge_amount || 0)) : 0;
  const avgPledge = participants.length ? totalPledge / participants.length : 0;
  const sortedParticipants = [...participants].sort((a, b) => (b.pledge_amount || 0) - (a.pledge_amount || 0));

  return (
    <ManagementLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          Round Details - Round {round?.round_number ?? roundId}
        </h1>

        {/* Round Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <p><strong>Round ID:</strong> {round?.id}</p>
          <p><strong>Registration Fee:</strong> {formatCurrency(round?.registration_fee ?? 0)}</p>
          <p><strong>Start Time:</strong> {round?.start_time ? new Date(round.start_time).toLocaleString() : '-'}</p>
          <p><strong>End Time:</strong> {round?.end_time ? new Date(round.end_time).toLocaleString() : '-'}</p>
          <p><strong>Total Participants:</strong> {participants.length}</p>
        </div>

        {/* Stats */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <p><strong>Total Pledge:</strong> {formatCurrency(totalPledge)}</p>
          <p><strong>Highest Pledge:</strong> {formatCurrency(highestPledge)}</p>
          <p><strong>Average Pledge:</strong> {formatCurrency(avgPledge)}</p>
        </div>

        {/* Participants Table */}
        <h2 className="text-xl font-bold mb-4">Participants</h2>
        {participants.length > 0 ? (
          <table className="w-full text-left border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">#</th>
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Full Name</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Age</th>
                <th className="px-4 py-2 border">Pledge Amount</th>
                <th className="px-4 py-2 border">Rank</th>
              </tr>
            </thead>
            <tbody>
              {sortedParticipants.map((p, index) => {
                const user = p.user || {};
                return (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 border text-center">{index + 1}</td>
                    <td className="px-4 py-2 border">{user.username || p.username || 'Unknown'}</td>
                    <td className="px-4 py-2 border">{user.full_name || p.full_name || 'Unknown'}</td>
                    <td className="px-4 py-2 border">{user.phone || user.phone_number || p.phone_number || '-'}</td>
                    <td className="px-4 py-2 border">{user.age ?? p.age ?? '-'}</td>
                    <td className="px-4 py-2 border">{formatCurrency(p.pledge_amount || 0)}</td>
                    <td className="px-4 py-2 border">{index + 1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No participants yet for this round.</p>
        )}

        <div className="mt-6">
          <Link to="/management/products" className="text-blue-600 hover:underline">
            ← Back to Products
          </Link>
        </div>
      </div>
    </ManagementLayout>
  );
}
