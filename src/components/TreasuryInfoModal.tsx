import React from 'react';
import { Modal } from 'flowbite-react';
import { HiX } from 'react-icons/hi';

interface TreasuryInfoModalProps {
    show: boolean;
    onClose: () => void;
}

const TreasuryInfoModal: React.FC<TreasuryInfoModalProps> = ({ show, onClose }) => {
    return (
        <Modal dismissible show={show} onClose={onClose}>
            <div className="bg-monad-light-blue text-monad-off-white rounded-t-lg relative">
                <div className="p-4 text-center text-2xl font-bold flex items-center justify-center">
                    <span className="mr-2">🏰</span>
                    Mouch Knight&#39;s Treasury Quest
                    <span className="ml-2">🏰</span>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-monad-off-white hover:text-white transition-colors duration-200"
                    aria-label="Close"
                >
                    <HiX className="w-5 h-5" />
                </button>
            </div>
            <div className="bg-monad-light-blue text-monad-off-white p-6">
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-monad-purple to-monad-light-blue rounded-lg p-6 shadow-lg border border-monad-purple/30">
                        <h2 className="text-lg text-monad-off-white mb-4 leading-relaxed">
                            Join the ultimate climbing challenge! Our treasury is loaded with <span
                            className="font-bold text-yellow-300">MON tokens</span> waiting to be distributed
                            among our brave knights.
                        </h2>
                        <div className="bg-monad-berry bg-opacity-20 rounded-lg p-4 mb-4 border border-monad-berry/30">
                            <h3 className="text-md text-monad-off-white font-semibold mb-2">🎁 How Rewards
                                Work:</h3>
                            <ul className="text-sm text-monad-off-white space-y-1 text-left">
                                <li>• <span className="font-semibold">Top Players:</span> Leaderboard champions
                                    get the biggest share
                                </li>
                                <li>• <span className="font-semibold">Lucky Winners:</span> Random players also
                                    win MON prizes
                                </li>
                            </ul>
                        </div>
                        <p className="text-md text-monad-off-white">
                            Race to the top, stack your MKT tokens, and claim your share of the treasury! The
                            higher you climb, the better your multiplier! 🚀
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-monad-light-blue text-monad-off-white p-4 rounded-b-lg">
                <div className="text-center">
                    <p className="text-sm opacity-80">
                        Good luck, brave knight! May your climbs be high and your rewards plentiful! ⚔️
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default TreasuryInfoModal;