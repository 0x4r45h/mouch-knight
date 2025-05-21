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
  async getLeaderboard(chainId: number, limit = 100): Promise<{ player: string; score: string }[]> {
    try {
      const leaderboard = await prisma.highScore.findMany({
        where: {
          chainId
        },
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
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
}

const highScoreService = new HighScoreService();
export default highScoreService;