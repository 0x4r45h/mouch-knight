// import { useState, useEffect, useCallback } from 'react';
// import { useAccount } from 'wagmi';
// import { gameConfig } from '@/config/gameConfig';
//
// export function usePlayerCooldown() {
//   const [inCooldown, setInCooldown] = useState(false);
//   const [remainingSeconds, setRemainingSeconds] = useState(0);
//   const [cooldownEnds, setCooldownEnds] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const { address } = useAccount();
//
//   const checkCooldown = useCallback(async () => {
//     if (!address || !gameConfig.cooldown.enabled) {
//       setInCooldown(false);
//       setRemainingSeconds(0);
//       setCooldownEnds(null);
//       return;
//     }
//
//     setIsLoading(true);
//     try {
//       const response = await fetch(`/api/game/cooldown?player=${address}`);
//       const data = await response.json();
//
//       if (data.data.cooldown) {
//         setInCooldown(true);
//         setRemainingSeconds(data.data.remainingSeconds);
//         setCooldownEnds(data.data.cooldownEnds);
//       } else {
//         setInCooldown(false);
//         setRemainingSeconds(0);
//         setCooldownEnds(null);
//       }
//     } catch (error) {
//       console.error('Error checking cooldown:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [address]);
//
//   // Update cooldown timer every second
//   useEffect(() => {
//     if (!inCooldown || !cooldownEnds) return;
//
//     const timer = setInterval(() => {
//       const now = new Date();
//       const end = new Date(cooldownEnds);
//       const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
//
//       if (diff <= 0) {
//         setInCooldown(false);
//         setRemainingSeconds(0);
//         setCooldownEnds(null);
//         clearInterval(timer);
//       } else {
//         setRemainingSeconds(diff);
//       }
//     }, 1000);
//
//     return () => clearInterval(timer);
//   }, [inCooldown, cooldownEnds]);
//
//   // Check cooldown on mount and when address changes
//   useEffect(() => {
//     checkCooldown();
//   }, [checkCooldown]);
//
//   return {
//     inCooldown,
//     remainingSeconds,
//     cooldownEnds,
//     isLoading,
//     checkCooldown
//   };
// }
//
// export default usePlayerCooldown;