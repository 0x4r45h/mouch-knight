'use client'
import React, { useCallback, useEffect, useState} from "react";
import Game from "@/components/game/Game";
import {useAccount} from "wagmi";
import {GameLogic} from "@/components/game/GameLogic";
import {useAppKitNetwork} from "@reown/appkit/react";
import {Table} from "flowbite-react";
import {useReadScoreManagerGetPlayerHighscore} from "@/generated";
import {HexString} from "@/config";
import {useContractConfig} from "@/hooks/custom";
export default function Home() {
    type ScoreTx = {
        scoreId: number,
        txHash : undefined | string
    }
    const [gameStarted, setGameStarted] = useState(false);
    const [gameSession, setGameSession] = useState(0);
    const [gameLoading, setGameLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const [scoreTx,setScoreTx] = useState<ScoreTx[]>([]);
    const account = useAccount()
    const {chainId} = useAppKitNetwork()
    const { chain } = useAccount()
    const [scoreManagerAddr, setScoreManagerAddr] = useState<HexString>("0x");
    const {contract: scoreManagerConfig, error: scoreManagerConfigError }= useContractConfig('ScoreManager', chain?.id)
    const { data: playerHighscore, refetch: refetchHighScore } = useReadScoreManagerGetPlayerHighscore({
        address: scoreManagerAddr ,
        args: [account.address as HexString],
        query: {
            enabled: !!account.address
        }
    });
    // get contract address on
    useEffect(() => {
        if (scoreManagerConfig) {
            setScoreManagerAddr(scoreManagerConfig.address);
        }
        if (scoreManagerConfigError) {
            console.log('Cant get scoreManagerContract address - ', scoreManagerConfigError)
        }

    }, [scoreManagerConfig, scoreManagerConfigError]);

    // update highscore after game finishes
    useEffect(() => {
        if (!gameStarted) {
            refetchHighScore();
        }
    }, [gameStarted, refetchHighScore]);
    //set highscore to localstorage
    useEffect(() => {
        if (playerHighscore) {
            console.log('set highscore on localstorage ', playerHighscore);
            localStorage.setItem('highScore', String(playerHighscore));
        }
    }, [playerHighscore]);

    const handleNewGame = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setGameLoading(true)
        setScoreTx([]);
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

    const gameOverHandler = useCallback((game: GameLogic, score: number) => {
        // setTimeout as workaround to show last frame. improve this
        setTimeout(() => {
            alert(`Game over! Score is ${score}`);
            game.restartGame();
            setGameStarted(false)
        }, 10)
    }, []);
    const handleScoreUpdate = useCallback(async (score: number, sessionId: number) => {

        try {
            const tx : ScoreTx = {
                scoreId : score,
                txHash: undefined
            }
            setScoreTx((prevScoreTx) => [...prevScoreTx, tx]);
            const response = await fetch('/api/game/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player: account.address,
                    session_id: sessionId,
                    chain_id: chainId,
                    score
                })
            })

            if (!response.ok) {
                console.error('Network response was not ok', response)
            }
            const result = await response.json();
            setScoreTx(prevScoreTx =>
                prevScoreTx.map(tx =>
                    tx.scoreId === score ? { ...tx, txHash: result.data.txHash } : tx
                )
            );
            console.log('Result is ', result)

        } catch (error) {
            console.error('Error during submit score:', error);
        }
    }, [account.address, chainId])
    return (
        <div className="flex flex-col items-center justify-start min-h-screen py-8">
            <div
                className=" relative w-full max-w-[540px] h-[885px] bg-gray-200 mx-auto flex items-center justify-center "
            >
                {account.isConnected && gameStarted ? (
                    /* If the game has started, render the LumberjackGame component */
                    <div className="w-full h-full">
                        <Game
                            sessionId={gameSession}
                            gameOverCallback={gameOverHandler}
                            scoreUpdateCallback={handleScoreUpdate}
                        />
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
                        ) : (
                            /* @ts-expect-error msg */
                            <appkit-connect-button/>
                        )}


                    </div>
                )}
            </div>
            {/*  Tx Table*/}

            <div className="w-full overflow-x-auto">
                <Table striped>
                    <Table.Head>
                        <Table.HeadCell>Score</Table.HeadCell>
                        <Table.HeadCell>Tx Link</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {scoreTx.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((scoreTx, key) => (
                            <Table.Row key={key} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    {scoreTx.scoreId}
                                </Table.Cell>
                                <Table.Cell>{
                                    scoreTx.txHash ? (
                                    <a className="underline" target="_blank" href={`${chain?.blockExplorers?.default.url ?? "http://localhost:3000/"}tx/${scoreTx.txHash}`}>
                                        <span className="block sm:hidden">Link</span>
                                        <span className="hidden sm:block">{scoreTx.txHash}</span>
                                    </a>
                                ) : (<span>Pending...</span>)
                                }
                            </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
                <div className="flex justify-between mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
    Page {currentPage} of {Math.ceil(scoreTx.length / rowsPerPage)}
  </span>
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage * rowsPerPage >= scoreTx.length}
                    >
                        Next
                    </button>
                </div>
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