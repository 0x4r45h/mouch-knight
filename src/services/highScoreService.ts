import prisma from '@/db/client';
import { Prisma } from '@prisma/client';

export interface HighScore {
  chainId: number;
  playerAddress: string;
  score: number;
  sessionId: number;
}

export class HighScoreService {

  async insertHighScore(highScore: HighScore): Promise<void> {
    const { chainId, playerAddress, score, sessionId } = highScore;

    try {
      // Find or create the player first
      const player = await prisma.player.upsert({
        where: { address: playerAddress },
        update: {},
        create: { address: playerAddress }
      });

      // Insert high score with the player ID
      await prisma.highScore.create({
        data: {
          chainId,
          playerId: player.id,
          score,
          sessionId
        }
      });
    } catch (error) {
      console.error('Error inserting high score:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard for a specific chain
   */
  async getLeaderboard(chainId: number, limit = 100, mode: 'farcaster' | 'monad-id' | 'full' = 'full'): Promise<{ player: string; score: string }[]> {
    try {
      // const whereClause: any = { chainId };
      const whereClause: Prisma.HighScoreWhereInput = { chainId };

      // Add filtering based on mode
      if (mode === 'farcaster') {
        whereClause.player = {
          fUsername: {
            not: null
          }
        };
      } else if (mode === 'monad-id') {
        whereClause.player = {
          mUsername: {
            not: null
          }
        };
      }

      const leaderboard = await prisma.highScore.findMany({
        where: whereClause,
        orderBy: {
          score: 'desc'
        },
        distinct: ['playerId'],
        take: limit,
        select: {
          player: {
            select: {
              address: true,
              fId: true,
              fUsername: true,
              fDisplayName: true,
              fPfpUrl: true,
              mUsername: true,
            }
          },
          score: true,
          sessionId: true,
        }
      });

      return leaderboard.map((entry) => ({
        player: entry.player.address,
        score: entry.score.toString(),
        sessionId: entry.sessionId.toString(),
        fId: entry.player.fId,
        fUsername: entry.player.fUsername,
        fDisplayName: entry.player.fDisplayName,
        fPfpUrl: entry.player.fPfpUrl,
        mUsername: entry.player.mUsername,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get highscore for a specific player on a specific chain
   */
  async getPlayerHighscore(playerAddress: string, chainId: number): Promise<string | null> {
    try {
      // Find the player first
      const player = await prisma.player.findUnique({
        where: { address: playerAddress }
      });

      if (!player) {
        return null;
      }

      // Get the highest score for this player on this chain
      const highScore = await prisma.highScore.findFirst({
        where: {
          chainId,
          playerId: player.id
        },
        orderBy: {
          score: 'desc'
        },
        select: {
          score: true
        }
      });

      return highScore ? highScore.score.toString() : null;
    } catch (error) {
      console.error('Error fetching player highscore:', error);
      throw error;
    }
  }
}

const highScoreService = new HighScoreService();
export default highScoreService;