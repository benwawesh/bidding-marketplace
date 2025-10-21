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
    const response = await axios.get('/bids/my_bids/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my bids:', error);
    throw error;
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
    
    // Find participation for this auction and round
    const participation = response.data.find(
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
