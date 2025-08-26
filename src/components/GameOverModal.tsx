import React from 'react';
import { Button, Modal } from "flowbite-react";
import { sdk } from '@farcaster/frame-sdk';
import { HiX } from 'react-icons/hi';
import { APP_URL ,MINI_APP_URL, getLeaderboardMode} from "@/config";

interface GameOverModalProps {
  show: boolean;
  onClose: () => void;
  score: number;
  mkt: number;
  highScore: number | bigint;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ 
  show, 
  onClose, 
  score, 
  mkt, 
  highScore 
}) => {
  const leaderboardMode = getLeaderboardMode();

  const handleCastShare = async () => {
    try {
      const result = await sdk.actions.composeCast({ 
        text: `🎮 I just scored ${score} in #MouchKnight! My highest score is ${highScore}. I earned ${mkt} MKT tokens! Can you beat my score? 🏆`,
        embeds: [`${MINI_APP_URL}`]
      });
      console.log('Cast result:', result);
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
    }
  };

  const handleXShare = () => {
    const text = `🎮 I just scored ${score} in #MouchKnight! My highest score is ${highScore}. I earned ${mkt} MKT tokens! Can you beat my score? 🏆`;
    const url = encodeURIComponent(`${APP_URL}`);
    const tweetText = encodeURIComponent(text);
    const xUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`;
    window.open(xUrl, '_blank');
  };

  const handleShare = leaderboardMode === 'monad-id' ? handleXShare : handleCastShare;
  const shareButtonText = leaderboardMode === 'monad-id' ? 'Post on X' : 'Cast to Farcaster';

  return (
    <Modal dismissible show={show} onClose={onClose}>
      <div className="bg-monad-light-blue text-monad-off-white rounded-t-lg relative">
        <div className="p-4 text-center text-2xl font-bold">GAME OVER!</div>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-monad-off-white hover:text-white"
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
      <div className="bg-monad-light-blue text-monad-off-white p-6">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center mb-4">
            {score > Number(highScore) ? "🎉 NEW HIGH SCORE! 🎉" : "Nice Try, Knight!"}
          </h3>
          
          <div className="bg-monad-purple bg-opacity-20 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Your Score:</span>
              <span className="text-xl font-bold">{score}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-semibold">MKT Earned:</span>
              <span className="text-xl font-bold text-green-400">{mkt}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-semibold">Your Best:</span>
              <span className="text-xl font-bold">{highScore.toString()}</span>
            </div>
          </div>
          
          <p className="text-center text-sm">
            Challenge your friends to beat your score! Share your achievement on Farcaster.
          </p>
        </div>
      </div>
      <div className="bg-monad-light-blue text-monad-off-white p-4 flex justify-between items-center rounded-b-lg">
        <Button
          size="lg"
          color="primary"
          className="rounded disabled:opacity-50 bg-monad-berry"
          onClick={handleShare}
        >
          {shareButtonText}
        </Button>
        <Button 
          size="lg"
          color="primary"
          className="rounded disabled:opacity-50 bg-monad-berry"
          onClick={onClose}
        >
          Play Again
        </Button>
      </div>
    </Modal>
  );
};

export default GameOverModal;