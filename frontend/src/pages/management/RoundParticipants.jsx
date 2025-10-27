// src/pages/RoundParticipants.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { formatCurrency } from '../../utils/helpers';

export default function RoundParticipants() {
  const { productId, roundId } = useParams();
  const navigate = useNavigate();

  if (!productId || !roundId) {
    return (
      <ManagementLayout>
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-bold mb-2">Invalid URL</h2>
          <p>Missing product or round ID.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </ManagementLayout>
    );
  }

  const {
    data: participants,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['round-participants', productId, roundId],
    queryFn: async () => {
      try {
        const res = await axios.get(`/auctions/${productId}/rounds/${roundId}/participants/`);
        return res.data;
      } catch (err) {
        console.error('Failed to fetch participants:', err.response || err);
        throw err;
      }
    },
    staleTime: 1000 * 60,
    retry: false,
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading participants...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (error) {
    return (
      <ManagementLayout>
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-bold mb-2">Error loading participants</h2>
          <p>{error.response?.status === 404 ? 'Participants not found for this round.' : error.message}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <div className="mt-4">
            <Link to={`/management/products/${productId}`} className="text-blue-600 hover:underline">
              ← Back to Product
            </Link>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (!participants || participants.length === 0) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">No Participants Found</h2>
          <p>It looks like no one has joined this round yet.</p>
          <Link to={`/management/products/${productId}`} className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Product
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  const sortedParticipants = [...participants].sort((a, b) => (b.pledge_amount || 0) - (a.pledge_amount || 0));

  return (
    <ManagementLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Participants - Round {roundId}</h1>
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
              const pledge = p.pledge_amount ?? 0;

              return (
                <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">{user.username || p.username || 'Unknown'}</td>
                  <td className="px-4 py-2 border">{user.full_name || p.full_name || 'Unknown'}</td>
                  <td className="px-4 py-2 border">{user.phone || user.phone_number || p.phone_number || '-'}</td>
                  <td className="px-4 py-2 border">{user.age ?? p.age ?? '-'}</td>
                  <td className="px-4 py-2 border">{formatCurrency(pledge)}</td>
                  <td className="px-4 py-2 border">{index + 1}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6">
          <Link to={`/management/products/${productId}`} className="text-blue-600 hover:underline">
            ← Back to Product
          </Link>
        </div>
      </div>
    </ManagementLayout>
  );
}
