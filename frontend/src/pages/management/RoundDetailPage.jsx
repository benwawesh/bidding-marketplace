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
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading round details...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (error) {
    return (
      <ManagementLayout>
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-bold mb-2">Error loading round</h2>
          <p>{error.message}</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Round Details - Round {round.round_number}</h1>

        {/* Round Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <p><strong>Round ID:</strong> {round.id}</p>
          <p><strong>Participation Fee:</strong> {formatCurrency(round.participation_fee)}</p>
          <p><strong>Start Time:</strong> {new Date(round.start_time).toLocaleString()}</p>
          <p><strong>End Time:</strong> {new Date(round.end_time).toLocaleString()}</p>
          <p><strong>Participants:</strong> {round.participant_count || 0}</p>
        </div>

        {/* Participants Table */}
        <h2 className="text-xl font-bold mb-4">Participants</h2>
        {round.participants?.length > 0 ? (
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
            {[...round.participants]
              .sort((a, b) => (b.pledge_amount || 0) - (a.pledge_amount || 0))
              .map((p, index) => {
                const user = p.user || {};
                const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
                const username = user.username || 'Unknown';
                const phone = user.phone_number || '-';
                const age = user.age ?? '-';
                const pledge = p.pledge_amount ?? 0;

                return (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 border text-center">{index + 1}</td>
                    <td className="px-4 py-2 border">{username}</td>
                    <td className="px-4 py-2 border">{fullName}</td>
                    <td className="px-4 py-2 border">{phone}</td>
                    <td className="px-4 py-2 border">{age}</td>
                    <td className="px-4 py-2 border">{formatCurrency(pledge)}</td>
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
          <Link to={`/management/products/${productId}`} className="text-blue-600 hover:underline">
            ← Back to Product
          </Link>
        </div>
      </div>
    </ManagementLayout>
  );
}
