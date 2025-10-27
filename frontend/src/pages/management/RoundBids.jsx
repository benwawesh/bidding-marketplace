// pages/management/RoundBids.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { formatCurrency } from '../../utils/helpers';

export default function RoundBids() {
  const { productId, roundId } = useParams();

  const { data: bids, isLoading, error } = useQuery({
    queryKey: ['round-bids', roundId],
    queryFn: async () => {
      const res = await axios.get(`/auctions/${productId}/rounds/${roundId}/bids/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading bids...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (error) {
    return (
      <ManagementLayout>
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-bold mb-2">Error loading bids</h2>
          <p>{error.message}</p>
        </div>
      </ManagementLayout>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">No Bids Found</h2>
          <Link to={`/management/auctions/${productId}`} className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Auction
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  // Sort bids by pledge_amount descending
  const sortedBids = [...bids].sort((a, b) => (b.pledge_amount || b.amount || 0) - (a.pledge_amount || a.amount || 0));

  return (
    <ManagementLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Bids - Round {roundId}</h1>

        <table className="w-full text-left border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">Full Name</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Age</th>
              <th className="px-4 py-2 border">Pledge</th>
              <th className="px-4 py-2 border">Rank</th>
            </tr>
          </thead>
          <tbody>
            {sortedBids.map((bid, index) => {
              const user = bid.user || {}; // fallback if backend has nested user
              const pledge = bid.pledge_amount ?? bid.amount ?? 0;

              return (
                <tr key={bid.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">{user.username || 'Unknown'}</td>
                  <td className="px-4 py-2 border">{user.full_name || 'Unknown'}</td>
                  <td className="px-4 py-2 border">{user.phone || user.phone_number || '-'}</td>
                  <td className="px-4 py-2 border">{user.age ?? '-'}</td>
                  <td className="px-4 py-2 border">{formatCurrency(pledge)}</td>
                  <td className="px-4 py-2 border">{index + 1}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6">
          <Link to={`/management/auctions/${productId}`} className="text-blue-600 hover:underline">
            ← Back to Auction
          </Link>
        </div>
      </div>
    </ManagementLayout>
  );
}
