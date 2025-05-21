import React from 'react';
import { Button, Modal } from "flowbite-react";
import { sdk } from '@farcaster/frame-sdk';

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
  const handleCastShare = async () => {
    try {
      const result = await sdk.actions.composeCast({ 
        text: `I just scored ${score} in Mouch Knight! My highest score is ${highScore}. I earned ${mkt} MKT tokens!`,
        embeds: ["https://mouch-knight.emberstake.xyz"]
      });
      console.log('Cast result:', result);
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Game Over!</Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Your Score: {score}
          </h3>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Your Minted MKT: {mkt}
          </h3>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Your Highest Score: {highScore}
          </h3>
        </div>
      </Modal.Body>
      <Modal.Footer className="flex justify-between">
        <Button
          size="lg"
          color="primary"
          className="rounded disabled:opacity-50"
          onClick={handleCastShare}
        >
          Cast to Farcaster
        </Button>
        <Button 
          size="lg"
          color="primary"
          className="rounded disabled:opacity-50"
          onClick={onClose}
        >
          Okay!
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GameOverModal;