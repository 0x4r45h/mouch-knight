'use client'
import React, {useEffect, useRef} from 'react';
import {GameLogic, GameEventDetail} from '@/components/game/GameLogic';
import {useAccount} from "wagmi";
import { useAppKitNetwork } from "@reown/appkit/react";

interface LumberjackGameProps {
    sessionId: number;
    gameOverCallback: (game: GameLogic, score: number) => void;
}

const Game: React.FC<LumberjackGameProps> = ({sessionId, gameOverCallback}) => {
    const account = useAccount()
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const btnLeftRef = useRef<HTMLButtonElement>(null);
    const btnRightRef = useRef<HTMLButtonElement>(null);
    const { chainId } = useAppKitNetwork()

    useEffect(() => {
        console.log('GameFrame Effect!');

        if (canvasRef.current && btnLeftRef.current && btnRightRef.current) {
            const handleScoreUpdate = async () => {
                try {
                    const response = await fetch('/api/game/score', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            player: account.address,
                            session_id: sessionId,
                            chain_id: chainId
                        })
                    })
                    if (!response.ok) {
                        console.error('Network response was not ok', response)
                    }
                    const result = await response.json();
                    console.log('Result is ', result)

                } catch (error) {
                    console.error('Error during deposit:', error);
                }
            }

            const game = new GameLogic(
                canvasRef.current,
                btnLeftRef.current,
                btnRightRef.current,
                720,
                980 // + 300px reserved for buttons = 1280
            );
            game.init();

            // Define event handlers separately so we can remove them later
            const handleScoreChange = (event: Event) => {
                const customEvent = event as CustomEvent<GameEventDetail>;
                const score = customEvent.detail.score;
                console.log('Score updated:', score);
                if (score) {
                    handleScoreUpdate();
                }
            };

            const handleGameOver = (event: Event) => {
                const customEvent = event as CustomEvent<GameEventDetail>;
                console.log('Game over! Final score:', customEvent.detail.score);
                console.log('Highscore:', customEvent.detail.highScore);
                gameOverCallback(game, customEvent.detail.score as number)
            };

            // Add event listeners
            game.eventTarget.addEventListener('scoreChange', handleScoreChange);
            game.eventTarget.addEventListener('gameOver', handleGameOver);

            game.render();

            // ✅ Cleanup function
            return () => {
                console.log('Cleaning up GameFrame...');
                game.eventTarget.removeEventListener('scoreChange', handleScoreChange);
                game.eventTarget.removeEventListener('gameOver', handleGameOver);

                // If `Lumberjack` has a cleanup method, call it
                if (game.destroy) {
                    console.log('Destroying Game instance...');
                    game.destroy();  // Assuming `destroy()` exists for cleanup
                }
            };
        }
    }, [account.address, gameOverCallback, sessionId]);
    return (
        <>
            <canvas ref={canvasRef} className="w-full" />
            <div className="h-[150px] flex items-center justify-center bg-[#d3f7ff]">
                <button ref={btnLeftRef} className="btn-game-control mx-2">
                    LEFT
                </button>
                <button ref={btnRightRef} className="btn-game-control mx-2">
                    RIGHT
                </button>
            </div>
        </>
    );
};

export default Game;