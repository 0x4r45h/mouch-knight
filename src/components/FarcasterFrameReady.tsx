'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

const FarcasterFrameReady = () => {
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        await sdk.actions.ready();
        // await sdk.actions.ready({ disableNativeGestures: true });
        console.log('Farcaster Frame SDK initialized');
      } catch (error) {
        console.error('Failed to initialize Farcaster Frame SDK:', error);
      }
    };

    initFarcaster();
  }, []);

  // This component doesn't render anything
  return null;
};

export default FarcasterFrameReady;