import React from 'react';
import { Button, Modal } from "flowbite-react";
import {HiX} from "react-icons/hi";

interface TipsModalProps {
  show: boolean;
  onClose: () => void;
}

const TipsModal: React.FC<TipsModalProps> = ({ show, onClose }) => {
  return (
    <Modal dismissible show={show} onClose={onClose}>
      <div className="bg-monad-light-blue text-monad-off-white rounded-t-lg relative">
        <div className="p-4 text-center text-2xl font-bold">HOW TO PLAY</div>
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
          <h3 className="text-xl font-bold mb-4">
            Ready to Break the Monad? 🎮
          </h3>
          
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="mr-2 text-monad-berry">🔗</span>
              <span>Connect your wallet on the Monad Network and start climbing!</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-monad-berry">⌨️</span>
              <span>On desktop, use the <strong>Left/Right Arrow keys</strong> or <strong>A & D keys</strong> to dodge obstacles.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-monad-berry">📱</span>
              <span>On mobile, tap the <strong>LEFT</strong> and <strong>RIGHT</strong> buttons to navigate.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-monad-berry">⏱️</span>
              <span>Keep moving to avoid running out of time! The progress bar shows your remaining time.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-monad-berry">⛓️</span>
              <span>Every move is recorded on the Monad blockchain - no gas fees needed!</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-monad-berry">💰</span>
              <span>Earn MKT tokens as you climb higher - the better your score, the bigger your rewards!</span>
            </li>
          </ul>
          
          <p className="text-center text-sm mt-4">
            Can you climb to the top of the leaderboard and prove Monad can handle your skills?
          </p>
        </div>
      </div>
      <div className="bg-monad-light-blue text-monad-off-white p-4 flex justify-center items-center rounded-b-lg">
        <Button 
          size="lg"
          color="primary"
          className="rounded disabled:opacity-50 bg-monad-berry"
          onClick={onClose}
        >
          Let&#39;s Climb!
        </Button>
      </div>
    </Modal>
  );
};

export default TipsModal;