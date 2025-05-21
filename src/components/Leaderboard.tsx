'use client';

import React, { useEffect, useState } from 'react';
import { Button, Modal } from "flowbite-react";
import { sdk } from '@farcaster/frame-sdk';
import { HiX } from 'react-icons/hi';

interface LeaderboardProps {
  openModal: boolean;
  closeModalAction: () => void;
  chainId: number;
  currentUserAddress?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  openModal,
  closeModalAction,
  chainId,
  currentUserAddress
}) => {
  type Score = {
    address: string,
    score: string,
    sessionId: string,
    fId?: number,
    fUsername?: string,
    fDisplayName?: string,
    fPfpUrl?: string,
  }
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const [scores, setScores] = useState<Score[]>([]);
  const [currentUserScore, setCurrentUserScore] = useState<Score | null>(null);

  useEffect(() => {
    if (openModal) {
      const fetchHighscores = async () => {
        try {
          const response = await fetch(`/api/game/score/highscore?chain_id=${chainId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.error(`couldn't fetch leaderboard`, response);
            return;
          }
          
          const result = await response.json();
          const leaderboard = result.data.leaderboard;
          const highScores: Score[] = leaderboard.map((value: {
            player: string,
            score: string,
            sessionId: string,
            fId?: number,
            fUsername?: string,
            fDisplayName?: string,
            fPfpUrl?: string
          }) => {
            const score: Score = {
              address: value.player,
              score: value.score,
              sessionId: value.sessionId,
              fId: value.fId,
              fUsername: value.fUsername,
              fDisplayName: value.fDisplayName,
              fPfpUrl: value.fPfpUrl,
            }
            return score;
          });
          
          setScores(highScores);
          
          // Find current user's score if address is provided
          if (currentUserAddress) {

            const userScore = highScores.find(score =>
              score.address.toLowerCase() === currentUserAddress.toLowerCase()
            );
            setCurrentUserScore(userScore || null);
          }
        } catch (error) {
          console.error('Error during loading highscore:', error);
        }
      };
      
      fetchHighscores();
    }
  }, [chainId, openModal, currentUserAddress]);

  const showProfile = (fid?: number) => {
    if (fid) {
      sdk.actions.viewProfile({ fid });
    }
  };

  return (
    <Modal dismissible show={openModal} onClose={closeModalAction} size="md">
      <div className="bg-monad-light-blue text-monad-off-white rounded-t-lg relative">
        <div className="p-4 text-center text-2xl font-bold">LEADERBOARD</div>
        {/* Added X button for mobile */}
        <button 
          onClick={closeModalAction}
          className="absolute top-4 right-4 text-monad-off-white hover:text-white"
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
      
      <div className="bg-monad-light-blue text-monad-off-white p-4">
        {/* Header row - Added more spacing between Score and Attempts */}
        <div className="grid grid-cols-12 mb-2 text-sm font-semibold">
          <div className="col-span-1">#</div>
          <div className="col-span-7">User</div>
          <div className="col-span-2 text-right pr-4">Score</div>
          <div className="col-span-2 text-right pr-4">Attempts</div>
        </div>
        
        {/* Current user row if available */}
        {currentUserScore && (
          <div className="bg-monad-berry bg-opacity-30 rounded-lg p-2 mb-3 grid grid-cols-12 items-center">
            <div className="col-span-1 font-bold">
              {scores.findIndex(s => s.address === currentUserScore.address) + 1}
            </div>
            <div className="col-span-7 flex items-center" onClick={() => showProfile(currentUserScore.fId)}>
              <div className="mr-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUserScore.fPfpUrl || '/images/character.png'} 
                  width={32} 
                  height={32} 
                  className="rounded-full" 
                  alt="User PFP" 
                />
              </div>
              <div>
                <div className="font-semibold">{currentUserScore.fDisplayName || currentUserScore.address.slice(0, 6)}</div>
                <div className="text-xs text-monad-off-white text-opacity-80">
                  {currentUserScore.fUsername ? `@${currentUserScore.fUsername}` : `${currentUserScore.address.slice(0, 4)}...${currentUserScore.address.slice(-4)}`}
                </div>
              </div>
            </div>
            <div className="col-span-2 text-right font-bold pr-4">{currentUserScore.score}</div>
            <div className="col-span-2 text-right pr-4">{currentUserScore.sessionId}</div>
          </div>
        )}
        
        {/* Divider */}
        <div className="border-b border-monad-off-white border-opacity-20 mb-3"></div>
        
        {/* Leaderboard rows - Added right padding to score and attempts */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {scores.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((score, index) => (
            <div 
              key={index} 
              className="grid grid-cols-12 items-center bg-monad-purple bg-opacity-20 rounded-lg p-2 hover:bg-opacity-30 transition-colors"
            >
              <div className="col-span-1 font-bold">
                {((currentPage - 1) * rowsPerPage) + index + 1}
              </div>
              <div className="col-span-7 flex items-center cursor-pointer" onClick={() => showProfile(score.fId)}>
                <div className="mr-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={score.fPfpUrl || '/images/character.png'} 
                    width={32} 
                    height={32} 
                    className="rounded-full" 
                    alt="User PFP" 
                  />
                </div>
                <div>
                  <div className="font-semibold">{score.fDisplayName || score.address.slice(0, 6)}</div>
                  <div className="text-xs text-monad-off-white text-opacity-80">
                    {score.fUsername ? `@${score.fUsername}` : `${score.address.slice(0, 4)}...${score.address.slice(-4)}`}
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-right font-bold pr-4">{score.score}</div>
              <div className="col-span-2 text-right pr-4">{score.sessionId}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="bg-monad-light-blue text-monad-off-white p-4 flex justify-between items-center rounded-b-lg">
        <Button
          size="sm"
          color="primary"
          className="rounded disabled:opacity-50 bg-monad-berry"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {Math.max(1, Math.ceil(scores.length / rowsPerPage))}
        </span>
        <Button
          size="sm"
          color="primary"
          className="rounded disabled:opacity-50 bg-monad-berry"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage * rowsPerPage >= scores.length}
        >
          Next
        </Button>
      </div>
    </Modal>
  );
};

export default Leaderboard;