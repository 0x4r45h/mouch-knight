'use client'
import React, { useState } from "react";
import Game from "@/components/game/Game";
import {useAccount} from "wagmi";
import {GameLogic} from "@/components/game/GameLogic";
import { useAppKitNetwork } from "@reown/appkit/react";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSession, setGameSession] = useState(0);
  const [gameLoading, setGameLoading] = useState(false)
    const account = useAccount()
    const { chainId } = useAppKitNetwork()

  const handleNewGame = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setGameLoading(true)
        try {
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: account.address,
                    chain_id: chainId
                })
            })
            if (!response.ok) {
                // TODO: show an error alert
                console.error('Network response was not ok', response)
                return;
            }
            const result = await response.json();
            setGameSession(result.data.session_id)
            console.log('Result is ', result)
            console.log('new game session is ', gameSession)
            setGameStarted(true)

        } catch (error) {
            console.error('Error during deposit:', error);
        } finally {
            setGameLoading(false)
        }
    }

    const gameOverHandler = (game: GameLogic, score: number) => {
        // setTimeout as workaround to show last frame. improve this
        setTimeout(() => {
            alert(`Game over! Score is ${score}`);
            game.restartGame();
            setGameStarted(false)
        }, 10)
    }

    return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8">
      <div
        className=" relative w-full max-w-[540px] h-[885px] bg-gray-200 mx-auto flex items-center justify-center "
      >
        {account.isConnected && gameStarted ? (
          /* If the game has started, render the LumberjackGame component */
          <div className="w-full h-full">
            <Game sessionId={gameSession} gameOverCallback={gameOverHandler}/>
          </div>
        ) : (
          /* Otherwise, show a placeholder with a "Start New Game" button */
          <div className="flex items-center justify-center w-full h-full">
              {account.isConnected ? (
                  <button
                      type="button"
                      className=" bg-blue-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={handleNewGame}
                      disabled={gameLoading}
                  >
                      {gameLoading ? 'Loading...' : 'Start New Game'}
                  </button>
              ) :  (
                  /* @ts-expect-error msg */
                  <appkit-connect-button />
              ) }


          </div>
        )}
      </div>

      {/* Section for other buttons (leaderboard, how to play, etc.) */}
      <div
        className=" flex flex-col gap-4 mt-6 w-full max-w-[800px] px-4 sm:px-6 sm:flex-row sm:justify-center"
      >
        <button
          type="button"
          className=" bg-stone-300 rounded-md px-4 py-2 text-black hover:bg-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
          Leaderboard
        </button>
        <button
          type="button"
          className=" bg-stone-300 rounded-md px-4 py-2 text-black hover:bg-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
          How to Play
        </button>
      </div>
    </div>
  );
}