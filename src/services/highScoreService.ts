import prisma from '@/db/client';

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
      // Directly insert the new high score entry
      await prisma.highScore.create({
        data: {
          chainId,
          playerAddress,
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
  async getLeaderboard(chainId: number, limit = 100): Promise<{ player: string; score: string }[]> {
    try {
      const leaderboard = await prisma.highScore.findMany({
        where: {
          chainId
        },
        orderBy: {
          score: 'desc'
        },
        distinct: ['playerAddress'],
        take: limit,
        select: {
          playerAddress: true,
          score: true,
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