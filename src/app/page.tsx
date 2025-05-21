'use client'
import React, {useCallback, useEffect, useState} from "react";
import Game from "@/components/game/Game";
import {useAccount} from "wagmi";
import {GameLogic} from "@/components/game/GameLogic";
import {useAppKitNetwork, useWalletInfo} from "@reown/appkit/react";
import {Button, Modal, Table} from "flowbite-react";
import { useGetPlayerHighscore, useScoreTokenBalanceOfPlayer} from "@/hooks/custom";
import Leaderboard from "@/components/Leaderboard";
import { sdk as farcasterSdk } from '@farcaster/frame-sdk';
import {UserContext} from "@farcaster/frame-core/esm/context";
import GameOverModal from "@/components/GameOverModal";
import TipsModal from "@/components/TipsModal";

export default function Home() {
    type ScoreTx = {
        moveId: undefined,
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
    const { walletInfo } = useWalletInfo();
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
        console.log('wallet info is ', walletInfo);

    }, [chain, refetchBalance, refetchHighScore, gameStarted, walletInfo]);


    //set highscore to localstorage
    useEffect(() => {
        console.log(`player high score is ${playerHighscore} , error is ${playerHighScoreError}`)
        if (playerHighscore != undefined) {
            console.log('set highscore on localstorage ', playerHighscore);
            localStorage.setItem('highScore', String(playerHighscore));
        }
    }, [playerHighscore, playerHighScoreError]);

    // get tx hash for each score
    useEffect(() => {
        const fetchTxHashes = async () => {
            // Find moves that don't have tx hashes yet
            const movesWithoutHash = scoreTx
                .filter(tx => tx.moveId && !tx.txHash)
                .map(tx => tx.moveId);

            if (movesWithoutHash.length === 0) return;

            try {
                const response = await fetch(`/api/game/score/tx-hash?moveIds=${movesWithoutHash.join(',')}`);
                if (!response.ok) {
                    console.error('Failed to fetch tx hashes:', response.status);
                    return;
                }

                const result = await response.json();
                const txHashMap = result.data;

                setScoreTx(prevTx => 
                    prevTx.map(tx =>
                            (tx.moveId && txHashMap[tx.moveId]) ? {...tx, txHash: txHashMap[tx.moveId]} : tx
                    )
                );
            } catch (error) {
                console.error('Error fetching tx hashes:', error);
            }
        };

        // Set up the interval
        const interval = setInterval(fetchTxHashes, 1000);

        // Cleanup on unmount or when scoreTx changes
        return () => clearInterval(interval);
    }, [scoreTx]);

    const handleNewGame = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        let farcasterUser: UserContext | null = null
        if (walletInfo?.name == 'farcaster') {
            const context = await farcasterSdk.context
            farcasterUser = context.user;
            console.log('fuser is ', farcasterUser);
        }
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
                    chain_id: chainId,
                    farcaster_user: farcasterUser
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
                moveId: undefined,
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
                return;
            }
            const result = await response.json();
            setScoreTx(prevScoreTx =>
                prevScoreTx.map(tx =>
                    tx.scoreId === score ? {...tx, moveId: result.data.moveId} : tx
                )
            );
            console.log('Result is ', result);

        } catch (error) {
            console.error('Error during submit score:', error);
        }
    }, [account.address, chainId]);
    return (
        <div className="flex flex-col items-center justify-start min-h-screen py-8">
            {chainId ? (<Leaderboard 
                chainId={Number(chainId)} 
                openModal={leaderboardModal} 
                closeModalAction={() => setLeaderboardModal(false)} 
                currentUserAddress={account.address}
            />) : <></>}
            <TipsModal 
                show={tipsModal}
                onClose={() => setTipsModal(false)}
            />
            <GameOverModal 
                show={gameOverModal}
                onClose={finishGame}
                score={lastGameScore}
                mkt={lastGameMKT}
                highScore={playerHighscore || 0}
            />
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