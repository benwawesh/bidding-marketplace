import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * WebSocket hook for real-time auction updates
 * @param {string} auctionId - UUID of the auction
 * @param {function} onLeaderboardUpdate - Callback when leaderboard updates
 * @param {function} onNewBid - Callback when new bid is placed
 */
export const useWebSocket = (auctionId, onLeaderboardUpdate, onNewBid) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!auctionId) return;

    // Don't create new connection if already connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping reconnect');
      return;
    }

    try {
      // WebSocket URL
      const wsUrl = `ws://127.0.0.1:8000/ws/auction/${auctionId}/`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'leaderboard_update' && onLeaderboardUpdate) {
            onLeaderboardUpdate(data.data);
          } else if (data.type === 'new_bid') {
            if (onNewBid) onNewBid(data.bid_data);
            if (onLeaderboardUpdate && data.leaderboard) {
              onLeaderboardUpdate(data.leaderboard);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected (code: ${event.code})`);
        setIsConnected(false);
        wsRef.current = null;

        // Only reconnect if it wasn't a clean close (1000) and we haven't exceeded attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to connect to real-time updates. Please refresh the page.');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to establish WebSocket connection');
    }
  }, [auctionId]); // ✅ ONLY depend on auctionId, not callbacks

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Close with code 1000 (normal closure) to prevent reconnection
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const requestLeaderboard = useCallback(() => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'request_leaderboard' }));
    }
  }, [isConnected]);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [auctionId]); // ✅ FIXED: Only depend on auctionId, not connect/disconnect

  return {
    isConnected,
    error,
    requestLeaderboard,
    disconnect,
  };
};
