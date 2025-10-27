import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';

export default function AuctionParticipantsPage() {
  const { id } = useParams();

  // Fetch auction details
  const { data: auction } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Fetch participants
  const { data: participantsData, isLoading } = useQuery({
    queryKey: ['auction-participants', id],
    queryFn: () => auctionsAPI.getParticipants(id).then(res => res.data),
  });

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading participants...</p>
        </div>
      </ManagementLayout>
    );
  }

  const participants = participantsData?.participants || [];
  const totalCount = participantsData?.total_count || 0;
  const totalRevenue = participantsData?.total_revenue || 0;

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
            Participants: {auction?.title}
          </h1>
          <p className="text-gray-600">All users who paid the entry fee</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total Participants</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Entry Fee</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {formatCurrency(auction?.participation_fee || 0)}
            </p>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Participants</h2>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Participants Yet</h3>
              <p className="text-gray-600">No one has paid the entry fee for this auction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fee Paid</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Paid At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant, index) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {participant.user.first_name || participant.user.username}
                          </p>
                          <p className="text-sm text-gray-500">@{participant.user.username}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{participant.user.email}</td>
                      <td className="py-4 px-4 text-gray-900">{participant.user.phone || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(participant.fee_paid)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(participant.paid_at).toLocaleString()}
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
