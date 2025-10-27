import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function AuctionBidsPage() {
  const { id } = useParams();

  // Fetch auction details
  const { data: auction } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Fetch all bids
  const { data: bidsData, isLoading } = useQuery({
    queryKey: ['auction-bids', id],
    queryFn: () => auctionsAPI.getBidsList(id).then(res => res.data),
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bids...</p>
        </div>
      </ManagementLayout>
    );
  }

  const bids = bidsData?.bids || [];
  const totalCount = bidsData?.total_count || 0;
  const highestAmount = bidsData?.highest_amount || 0;

  return (
    <ManagementLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/management/products/${id}`} 
            className="text-red-600 hover:underline mb-2 inline-block"
          >
            ← Back to Product
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All Bids: {auction?.title}
          </h1>
          <p className="text-gray-600">Complete ranking of all pledges</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total Bids</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Highest Bid</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(highestAmount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Starting Bid</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {formatCurrency(auction?.base_price || 0)}
            </p>
          </div>
        </div>

        {/* Bids Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Bids (Ranked)</h2>
          </div>

          {bids.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Bids Yet</h3>
              <p className="text-gray-600">No bids have been placed on this auction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pledge Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bids.map((bid) => (
                    <tr 
                      key={bid.id} 
                      className={`hover:bg-gray-50 ${bid.position === 1 ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {bid.position === 1 && <span className="text-2xl">🏆</span>}
                          <span className={`font-bold ${bid.position === 1 ? 'text-yellow-600 text-lg' : 'text-gray-600'}`}>
                            #{bid.position}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {bid.user.first_name || bid.user.username}
                          </p>
                          <p className="text-sm text-gray-500">@{bid.user.username}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{bid.user.email}</td>
                      <td className="py-4 px-4 text-gray-900">{bid.user.phone || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`font-bold text-lg ${bid.position === 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatCurrency(bid.pledge_amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(bid.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}
