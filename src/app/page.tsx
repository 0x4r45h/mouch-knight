'use client'
import React, {useCallback, useEffect, useState} from "react";
import Game from "@/components/game/Game";
import {useAccount} from "wagmi";
import {GameLogic} from "@/components/game/GameLogic";
import {useAppKitNetwork} from "@reown/appkit/react";
import {Button, Modal, Table} from "flowbite-react";
import { useGetPlayerHighscore, useScoreTokenBalanceOfPlayer} from "@/hooks/custom";
import Leaderboard from "@/components/Leaderboard";
import {startNewGameSession} from "@/services/newGameService";

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
    const [lastGameRef, setLastGameRef] = useState<GameLogic>();
    const [lastGameScore, setLastGameScore] = useState(0);
    const [lastGameMKT, setLastGameMKT] = useState(0);
    const [gameOverModal, setGameOverModal] = useState(false);
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

        if (!account.address || !chainId) {
            console.log('Wallet not connected');
            return;
        }
        try {

            // const result = await startNewGameSession(account.address, Number(chainId));
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
            const result = await response.json();

            setGameSession(result.data.session_id)
            setGameStarted(true)

        } catch (error) {
            console.error('Failed to start game', error);
        } finally {
            setGameLoading(false)
        }
    }

    const gameOverHandler = useCallback((game: GameLogic, score: number, highScore: number, mkt: number) => {
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
        setLastGameRef(game);
        setLastGameScore(score);
        setLastGameMKT(mkt);
        setGameOverModal(true)
        setGameStarted(false);

    }, [account.address, chainId]);
    const finishGame = () => {
        lastGameRef?.restartGame();
        setLastGameRef(undefined);
        setLastGameScore(0);
        setLastGameMKT(0);
        setGameOverModal(false)
    }
    const handleScoreUpdate = useCallback(async (score: number, sessionId: number) => {
        try {
            const tx: ScoreTx = {
                scoreId: score,
                txHash: undefined
            }
            setScoreTx((prevScoreTx) => [...prevScoreTx, tx]);

            // Generate verification hash using WASM
            const { generateTimedVerificationHash } = await import('@/lib/wasm-loader');
            const { hash, timestamp } = await generateTimedVerificationHash(
                account.address as string,
                score,
                Number(chainId),
                sessionId
            );

            const response = await fetch('/api/game/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player: account.address,
                    session_id: sessionId,
                    chain_id: chainId,
                    score,
                    verification: {
                        hash,
                        timestamp
                    }
                })
            });

            if (!response.ok) {
                console.error('Network response was not ok', response);
            }
            const result = await response.json();
            setScoreTx(prevScoreTx =>
                prevScoreTx.map(tx =>
                    tx.scoreId === score ? {...tx, txHash: result.data.txHash} : tx
                )
            );
            console.log('Result is ', result);

        } catch (error) {
            console.error('Error during submit score:', error);
        }
    }, [account.address, chainId]);
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
                    <Button size="lg"
                            color="primary"
                            className="rounded disabled:opacity-50"
                            onClick={() => setTipsModal(false)}>Let&#39;s Go!
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={gameOverModal} onClose={() => finishGame()}>
                <Modal.Header>Game Over!</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Your Score: {lastGameScore}
                        </h3>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Your Minted MKT: {lastGameMKT}
                        </h3>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Your Highest Score: {playerHighscore}
                        </h3>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button size="lg"
                            color="primary"
                            className="rounded disabled:opacity-50"
                            onClick={() => finishGame()}>Okay!
                    </Button>
                </Modal.Footer>
            </Modal>
            {account.isConnected && (
                <div className="flex justify-between w-full max-w-[540px]">
                    <span>MKT Balance: {playerBalance ? playerBalance / (BigInt(10) ** BigInt(18)) : 0}</span>
                    <span>Highscore: {playerHighscore}</span>
                </div>
            )}
            <div
                className=" relative w-full max-w-[540px] mx-auto flex items-center justify-center mt-5 mb-5 "
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
                    <div className="flex items-center justify-center w-full flex-col space-y-4 ">
                        <h1 className="text-2xl font-bold w-full">
                            Can You Break the Monad with Mouch Knight?
                        </h1>
                        <h2 className="text-lg w-full">
                            Calling all Nads! The Monad network claims it’s unbreakable—but can Mouch Knight prove it wrong? Dash up the tower, dodge pesky obstacles, and climb faster than a caffeinated squire. (Seriously, is it even *possible* to break this thing?)
                        </h2>
                        <h3 className="text-md w-full">
                            Race to the top of the leaderboard and stack MKT tokens! The higher you climb in a session, the juicier the multiplier—more MKT for every epic ascent!
                        </h3>
                        {account.isConnected ? (
                            <Button
                                color="primary"
                                size="xl"
                                className="bg-monad-berry  rounded-md focus:outline-none focus:ring-2 w-full"
                                onClick={handleNewGame}
                                disabled={gameLoading}
                            >
                                {gameLoading ? 'Loading...' : 'Start Climbing!'}
                            </Button>
                        ) : (
                            /* @ts-expect-error msg */
                            <appkit-connect-button className="" />
                        )}
                    </div>
                )}
            </div>
            {/*  Tx Table*/}
            {scoreTx.length !== 0 && (
                <div className="w-full overflow-x-auto">
                    <Table striped className="text-monad-black font-bold ">
                        <Table.Head >
                            <Table.HeadCell className="bg-purple-500">Score</Table.HeadCell>
                            <Table.HeadCell className="bg-purple-500">Tx Link</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y ">
                            {scoreTx.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((scoreTx, key) => (
                                <Table.Row key={key} className="hover:bg-purple-400 odd:bg-purple-200 even:bg-purple-300 odd:dark:bg-gray-800 even:dark:bg-gray-700">
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                        {scoreTx.scoreId}
                                    </Table.Cell>
                                    <Table.Cell>{
                                        scoreTx.txHash ? (
                                            <a className="underline" target="_blank"
                                               href={`${chain?.blockExplorers?.default.url ?? "http://testnet.monadexplorer.com/"}tx/${scoreTx.txHash}`}>
                                                <span className="block sm:hidden">{`${scoreTx.txHash.slice(0, 4)}...${scoreTx.txHash.slice(-4)}`}</span>
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
                        <Button
                            size="lg"
                            color="primary"
                            className="rounded disabled:opacity-50"
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>
    Page {currentPage} of {Math.ceil(scoreTx.length / rowsPerPage)}
  </span>
                        <Button
                            size="lg"
                            color="primary"
                            className="rounded disabled:opacity-50"
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage * rowsPerPage >= scoreTx.length}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
            {/* Section for other buttons (leaderboard, how to play, etc.) */}
            <div
                className=" flex flex-col gap-4 mt-6 w-full max-w-[800px] px-4 sm:px-6 sm:flex-row sm:justify-center"
            >
                <Button
                    color="primary"
                    className=" bg-monad-berry  rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onClick={() => setLeaderboardModal(true)}
                >
                    Leaderboard
                </Button>
                <Button
                    color="primary"
                    className=" bg-monad-berry rounded-md px-4 py-2  focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onClick={() => setTipsModal(true)}
                >
                    How to Play
                </Button>
            </div>
        </div>
    );
}