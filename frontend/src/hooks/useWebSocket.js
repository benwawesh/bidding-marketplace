import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (auctionId, onLeaderboardUpdate, onBidPlaced, onRoundUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const callbacksRef = useRef({ onLeaderboardUpdate, onBidPlaced, onRoundUpdate });

  useEffect(() => {
    callbacksRef.current = { onLeaderboardUpdate, onBidPlaced, onRoundUpdate };
  }, [onLeaderboardUpdate, onBidPlaced, onRoundUpdate]);

  useEffect(() => {
    if (!auctionId) return;

    let isMounted = true;
    console.log('🔌 Creating WebSocket connection for auction:', auctionId);

    // Use dynamic host based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/auction/${auctionId}/`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      if (!isMounted) {
        console.log('⚠️  Component unmounted, closing socket');
        socket.close();
        return;
      }
      console.log('✅ WebSocket connected and stable');
      ws.current = socket;
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      if (!isMounted) return;

      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message type:', message.type);

        if (message.type === 'leaderboard_update') {
          callbacksRef.current.onLeaderboardUpdate?.(message.data);
        } else if (message.type === 'bid_placed') {
          callbacksRef.current.onBidPlaced?.(message.data);
        } else if (message.type === 'round_update') {
          console.log('🔄 Round update received:', message.data);
          callbacksRef.current.onRoundUpdate?.(message.data);
        } else {
          callbacksRef.current.onLeaderboardUpdate?.(message);
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    };

    socket.onerror = () => {
      if (!isMounted) return;
      console.error('❌ WebSocket error');
      setIsConnected(false);
    };

    socket.onclose = (event) => {
      if (!isMounted) return;
      console.log('🔌 WebSocket closed, code:', event.code);
      setIsConnected(false);
    };

    ws.current = socket;

    return () => {
      console.log('🧹 Cleanup: closing WebSocket');
      isMounted = false;

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000);
      }
    };
  }, [auctionId]);

  return { isConnected };
};
