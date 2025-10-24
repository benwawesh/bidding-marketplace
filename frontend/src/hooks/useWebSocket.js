import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (auctionId, onLeaderboardUpdate, onBidPlaced, onRoundUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const callbacksRef = useRef({ onLeaderboardUpdate, onBidPlaced, onRoundUpdate });
  
  // Update callbacks without triggering reconnect
  useEffect(() => {
    callbacksRef.current = { onLeaderboardUpdate, onBidPlaced, onRoundUpdate };
  }, [onLeaderboardUpdate, onBidPlaced, onRoundUpdate]);

  useEffect(() => {
    if (!auctionId) return;

    let isMounted = true;
    console.log('🔌 Creating WebSocket connection for auction:', auctionId);
    
    const wsUrl = `ws://127.0.0.1:8000/ws/auction/${auctionId}/`;
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
      console.log('🔌 WebSocket closed');
      setIsConnected(false);
    };

    ws.current = socket;

    // Cleanup
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
