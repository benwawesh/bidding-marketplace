import axios from './axios';

/**
 * Bidding API functions
 */

// Get leaderboard for an auction
export const getLeaderboard = async (auctionId) => {
  try {
    const response = await axios.get(`/auctions/${auctionId}/leaderboard/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// Get all bids for an auction
export const getBids = async (auctionId) => {
  try {
    const response = await axios.get(`/auctions/${auctionId}/bids/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bids:', error);
    throw error;
  }
};

// Place a bid/pledge
export const placeBid = async (auctionId, pledgeAmount) => {
  try {
    const token = localStorage.getItem('bidmarket_access_token');
    const response = await axios.post(
      '/bids/',
      {
        auction: auctionId,
        pledge_amount: pledgeAmount,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};

// Get user's bids
export const getMyBids = async () => {
  try {
    const token = localStorage.getItem('bidmarket_access_token');
    // Use /bids/ endpoint - it already filters to current user via get_queryset
    const response = await axios.get('/bids/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data?.results || response.data || [];
  } catch (error) {
    console.error('Error fetching my bids:', error);
    throw error;
  }
};

// Get user's latest bid for a specific auction and round
export const getMyLatestBidForRound = async (auctionId, roundId) => {
  try {
    const token = localStorage.getItem('bidmarket_access_token');
    // Use /bids/ endpoint - it already filters to current user via get_queryset
    const response = await axios.get('/bids/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle paginated response
    const bids = response.data?.results || response.data || [];

    // Filter bids for this auction and round, get the most recent
    const bidsForRound = bids.filter(
      (bid) => bid.auction?.id === auctionId && bid.round_info?.id === roundId && bid.is_valid
    );

    if (bidsForRound.length === 0) return null;

    // Sort by submitted_at descending and return the first (most recent)
    bidsForRound.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    return bidsForRound[0];
  } catch (error) {
    console.error('Error fetching latest bid for round:', error);
    return null;
  }
};

// Get rounds for an auction
export const getRounds = async (auctionId) => {
  try {
    const response = await axios.get(`/auctions/${auctionId}/rounds/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rounds:', error);
    throw error;
  }
};

// Check if user has participated in current round
export const checkParticipation = async (auctionId, roundId) => {
  try {
    const token = localStorage.getItem('bidmarket_access_token');
    const response = await axios.get('/participations/my_participations/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle paginated response
    const participations = response.data?.results || response.data || [];

    // Find participation for this auction and round
    const participation = participations.find(
      (p) => p.auction === auctionId && p.round === roundId && p.payment_status === 'completed'
    );

    return !!participation;
  } catch (error) {
    console.error('Error checking participation:', error);
    return false;
  }
};

// Mock payment (for now - replace with real M-Pesa later)
export const mockPayment = async (auctionId, roundId, amount) => {
  try {
    const token = localStorage.getItem('bidmarket_access_token');
    
    // Create participation record
    const response = await axios.post(
      '/participations/',
      {
        auction: auctionId,
        round: roundId,
        fee_paid: amount,
        payment_status: 'completed',
        paid_at: new Date().toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
