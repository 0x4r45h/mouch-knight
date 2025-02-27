'use client'
import React, {useCallback, useEffect, useState} from "react";
import Game from "@/components/game/Game";
import {useAccount} from "wagmi";
import {GameLogic} from "@/components/game/GameLogic";
import {useAppKitNetwork} from "@reown/appkit/react";
import {Button, Modal, Table} from "flowbite-react";
import { useGetPlayerHighscore, useScoreTokenBalanceOfPlayer} from "@/hooks/custom";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
    type ScoreTx = {
        scoreId: number,
        txHash: undefined | string
    }
    const [leaderboardModal, setLeaderboardModal ] = useState(false)
    const [tipsModal, setTipsModal ] = useState(false)
    const [gameStarted, setGameStarted] = useState(false);
    const [gameSession, setGameSession] = useState(0);
    const [gameLoading, setGameLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const [scoreTx, setScoreTx] = useState<ScoreTx[]>([]);
    const account = useAccount()
    const {chainId} = useAppKitNetwork()
    const {chain} = useAccount()
    const {
        data: playerHighscore,
        refetch: refetchHighScore,
        error: playerHighScoreError
    } = useGetPlayerHighscore();
    const {
        data: playerBalance,
        refetch: refetchBalance,
    } = useScoreTokenBalanceOfPlayer();

    useEffect(() => {
        console.log(`update highscore on init`)
        refetchHighScore();
        refetchBalance();
    }, [chain, refetchBalance, refetchHighScore, gameStarted]);


    //set highscore to localstorage
    useEffect(() => {
        console.log(`player high score is ${playerHighscore} , error is ${playerHighScoreError}`)
        if (playerHighscore != undefined) {
            console.log('set highscore on localstorage ', playerHighscore);
            localStorage.setItem('highScore', String(playerHighscore));
        }
    }, [playerHighscore, playerHighScoreError]);

    const handleNewGame = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setGameLoading(true)
        setScoreTx([]);
        setCurrentPage(1)
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

    const gameOverHandler = useCallback((game: GameLogic, score: number, highScore: number) => {
        console.log(`score is ${score} and highscore is ${highScore}`)
        if (score == highScore) {
            try {
                fetch('/api/game/score/highscore', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        player: account.address,
                        chain_id: chainId
                    })
                })

            } catch (error) {
                console.error('Error during updating high score:', error);
            }
        }

        // setTimeout as workaround to show last frame. improve this
        setTimeout(() => {
            alert(`Game over! Score is ${score}`);
            game.restartGame();
            setGameStarted(false)
        }, 10)
    }, [account.address, chainId]);
    const handleScoreUpdate = useCallback(async (score: number, sessionId: number) => {

        try {
            const tx: ScoreTx = {
                scoreId: score,
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
                    tx.scoreId === score ? {...tx, txHash: result.data.txHash} : tx
                )
            );
            console.log('Result is ', result)

        } catch (error) {
            console.error('Error during submit score:', error);
        }
    }, [account.address, chainId]);
    // const closeModal = () => setLeaderboardModal(false)
    return (
        <div className="flex flex-col items-center justify-start min-h-screen py-8">
            {chainId ? (<Leaderboard chainId={Number(chainId)} openModal={leaderboardModal} closeModalAction={() => setLeaderboardModal(false)}  />) : <></>}
            <Modal dismissible show={tipsModal} onClose={() => setTipsModal(false)}>
                <Modal.Header>How to play?</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Game Instructions
                        </h3>
                        <ul className="list-disc list-inside text-base leading-relaxed text-gray-500 dark:text-gray-400">
                            <li>Connect a wallet on the Monad Network and start a new game.</li>
                            <li>On desktop, use the Left/Right Arrow keys or A & D keys to move.</li>
                            <li>On mobile, touch the two large buttons to move the character.</li>
                            <li>Your goal is to avoid branches and keep moving, or time will run out.</li>
                            <li>Every move is a transaction on the Monad blockchain, with fees covered by our relayer account.</li>
                        </ul>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => setTipsModal(false)}>Let&#39;s Go!</Button>
                </Modal.Footer>
            </Modal>
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
                            <Button
                                className=" font-semibold px-4 py-2 rounded-md  focus:outline-none focus:ring-2 "
                                onClick={handleNewGame}
                                disabled={gameLoading}
                            >
                                {gameLoading ? 'Loading...' : 'Start New Game'}
                            </Button>
                        ) : (
                            /* @ts-expect-error msg */
                            <appkit-connect-button/>
                        )}


                    </div>
                )}
            </div>
            <p>Balance is {playerBalance}</p>
            <p>Highscore is {playerHighscore}</p>
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
                                        <a className="underline" target="_blank"
                                           href={`${chain?.blockExplorers?.default.url ?? "http://localhost:3000/"}tx/${scoreTx.txHash}`}>
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
                <Button
                    className=" bg-stone-300 rounded-md px-4 py-2 text-black hover:bg-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onClick={() => setLeaderboardModal(true)}
                >
                    Leaderboard
                </Button>
                <Button
                    className=" bg-stone-300 rounded-md px-4 py-2 text-black hover:bg-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onClick={() => setTipsModal(true)}
                >
                    How to Play
                </Button>
            </div>
        </div>
    );
}