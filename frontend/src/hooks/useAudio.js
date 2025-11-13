import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing audio playback in auctions
 * @param {string} url - URL or path to the audio file
 * @param {object} options - Configuration options
 * @returns {object} Audio controls and state
 */
export function useAudio(url, options = {}) {
  const {
    autoPlay = true,
    loop = true,
    volume = 0.3, // Lower default volume for background music
  } = options;

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize audio element
  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      setError('No audio file provided');
      return;
    }

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = currentVolume;
    audioRef.current = audio;

    // Event listeners
    const handleCanPlay = () => {
      setIsLoading(false);
      // Auto play if enabled (with user gesture requirement handling)
      if (autoPlay) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Auto-play prevented by browser:', err.message);
            // Browsers block autoplay without user interaction
            setIsPlaying(false);
          });
      }
    };

    const handleError = (e) => {
      console.error('Audio loading error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (!loop) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [url, loop, autoPlay, currentVolume]);

  // Play function
  const play = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Play error:', err);
          setError('Failed to play audio');
        });
    }
  };

  // Pause function
  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle play/pause
  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Set volume (0 to 1)
  const setVolume = (vol) => {
    const newVolume = Math.max(0, Math.min(1, vol)); // Clamp between 0 and 1
    setCurrentVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Mute/unmute
  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return {
    isPlaying,
    isLoading,
    error,
    currentVolume,
    isMuted,
    play,
    pause,
    toggle,
    setVolume,
    toggleMute,
  };
}
