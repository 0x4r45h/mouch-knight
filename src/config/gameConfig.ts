// Game configuration settings

export interface GameConfig {
  // Cooldown settings
  cooldown: {
    durationSeconds: number;
    enabled: boolean;
  };
  
  // Token costs for purchasing game sessions
  sessionCost: {
    // MKT token (ERC20)
    mkt: {
      perSession: string; // In wei (as string to handle large numbers)
      enabled: boolean;
    };
    // Native token (MON)
    native: {
      perSession: string; // In wei (as string to handle large numbers)
      enabled: boolean;
    };
  };
  
  // Rewards
  rewards: {
    // MKT token rewards
    mkt: {
      baseAmount: string; // Base amount per game in wei
      multiplierFactor: number; // Multiplier based on score
      enabled: boolean;
    };
  };
}

// Load configuration from environment variables with defaults
export const gameConfig: GameConfig = {
  cooldown: {
    durationSeconds: parseInt(process.env.NEXT_PUBLIC_GAME_COOLDOWN_SECONDS || '3600', 10), // Default: 1 hour
    enabled: process.env.NEXT_PUBLIC_GAME_COOLDOWN_ENABLED !== 'false', // Default: true
  },
  
  sessionCost: {
    mkt: {
      perSession: process.env.NEXT_PUBLIC_GAME_SESSION_COST_MKT || '1000000000000000000', // Default: 1 MKT
      enabled: process.env.NEXT_PUBLIC_GAME_SESSION_COST_MKT_ENABLED !== 'false', // Default: true
    },
    native: {
      perSession: process.env.NEXT_PUBLIC_GAME_SESSION_COST_NATIVE || '10000000000000000', // Default: 0.01 MON
      enabled: process.env.NEXT_PUBLIC_GAME_SESSION_COST_NATIVE_ENABLED !== 'false', // Default: true
    },
  },
  
  rewards: {
    mkt: {
      baseAmount: process.env.NEXT_PUBLIC_GAME_REWARD_MKT_BASE || '100000000000000000', // Default: 0.1 MKT
      multiplierFactor: parseFloat(process.env.NEXT_PUBLIC_GAME_REWARD_MKT_MULTIPLIER || '0.01'), // Default: 0.01
      enabled: process.env.NEXT_PUBLIC_GAME_REWARD_MKT_ENABLED !== 'false', // Default: true
    },
  },
};

// Helper functions to work with the config
export function formatTokenAmount(amount: string, decimals: number = 18): string {
  const value = BigInt(amount);
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;
  
  // Format the fractional part to have leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  
  // Trim trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional.length > 0) {
    return `${wholePart}.${trimmedFractional}`;
  }
  
  return wholePart.toString();
}

// Export the config as default
export default gameConfig;