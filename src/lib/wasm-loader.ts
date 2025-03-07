// This file handles loading the WASM module

// Define an interface for our WASM module
interface GameVerificationModule {
  default: () => Promise<void>;
  generate_verification_hash: (
      playerAddress: string,
      currentScore: number,
      chainId: number,
      sessionId: number
  ) => string;

  generate_timed_verification_hash: (
      playerAddress: string,
      currentScore: number,
      chainId: number,
      sessionId: number,
      timestamp: bigint
  ) => string;
}

let wasmModule: GameVerificationModule | null = null;
let isInitialized = false;
let isLoading = false;
let loadingPromise: Promise<GameVerificationModule> | null = null;

export async function loadWasmModule(): Promise<GameVerificationModule> {
  if (wasmModule && isInitialized) {
    return wasmModule;
  }

  if (isLoading && loadingPromise) {
    return loadingPromise;
  }

  isLoading = true;
  loadingPromise = (async () => {
    try {
      // Dynamic import of the WASM module
      const wasmImport = await import('@/../../wasm/pkg/game_verification');

      // Initialize the WASM module
      await wasmImport.default();
      isInitialized = true;

      // Cast the imported module to our interface
      wasmModule = wasmImport as unknown as GameVerificationModule;
      return wasmModule;
    } catch (error) {
      console.error('Failed to load WASM module:', error);
      throw error;
    } finally {
      isLoading = false;
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export async function generateVerificationHash(
    playerAddress: string,
    currentScore: number,
    chainId: number,
    sessionId: number
): Promise<string> {
  const wasm = await loadWasmModule();
  return wasm.generate_verification_hash(
      playerAddress,
      currentScore,
      chainId,
      sessionId
  );
}

export async function generateTimedVerificationHash(
    playerAddress: string,
    currentScore: number,
    chainId: number,
    sessionId: number
): Promise<{hash: string; timestamp: number}> {
  const wasm = await loadWasmModule();
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    hash: wasm.generate_timed_verification_hash(
        playerAddress,
        currentScore,
        chainId,
        sessionId,
        BigInt(timestamp)
    ),
    timestamp
  };
}