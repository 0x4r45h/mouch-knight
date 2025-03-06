import prisma from '@/db/client';

export interface HighScore {
  chainId: number;
  playerAddress: string;
  score: bigint;
  sessionId: bigint;
}

export class HighScoreService {
  /**
   * Upsert a high score (insert or update if higher)
   */
  async upsertHighScore(highScore: HighScore): Promise<void> {
    const { chainId, playerAddress, score, sessionId } = highScore;

    try {
      // First try to find the existing record
      const existingScore = await prisma.highScore.findUnique({
        where: {
          chainId_playerAddress: {
            chainId,
            playerAddress
          }
        }
      });

      // Only update if the new score is higher or no record exists
      if (!existingScore || existingScore.score < score) {
        await prisma.highScore.upsert({
          where: {
            chainId_playerAddress: {
              chainId,
              playerAddress
            }
          },
          update: {
            score,
            sessionId,
            updatedAt: new Date()
          },
          create: {
            chainId,
            playerAddress,
            score,
            sessionId
          }
        });
      }
    } catch (error) {
      console.error('Error upserting high score:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard for a specific chain
   */
  async getLeaderboard(chainId: number, limit = 100): Promise<{ player: string; score: string }[]> {
    try {
      const leaderboard = await prisma.highScore.findMany({
        where: {
          chainId
        },
        orderBy: {
          score: 'desc'
        },
        take: limit,
        select: {
          playerAddress: true,
          score: true
        }
      });

      return leaderboard.map((entry: { playerAddress: string; score: { toString: () => string; }; }) => ({
        player: entry.playerAddress,
        score: entry.score.toString()
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
}

export default new HighScoreService();