'use client'
import React, {useCallback, useEffect, useState} from "react";
import Game from "@/components/game/Game";
import {useAccount} from "wagmi";
import {GameLogic} from "@/components/game/GameLogic";
import {Button, Table} from "flowbite-react";
import {
    useGetPlayerHighscore,
    useScoreTokenBalanceOfPlayer,
    usePlayerCooldown,
    useTreasuryBalance
} from "@/hooks/custom";
import Leaderboard from "@/components/Leaderboard";
import {sdk as farcasterSdk} from '@farcaster/frame-sdk';
import {UserContext} from "@farcaster/frame-core/esm/context";
import GameOverModal from "@/components/GameOverModal";
import TipsModal from "@/components/TipsModal";
import PurchaseSessionsModal from '@/components/PurchaseSessionsModal';
import TreasuryInfoModal from '@/components/TreasuryInfoModal';
import {formatUnits} from "viem";
import {ConnectButton} from "@/components/ConnectButton";
export default function Home() {
    type ScoreTx = {
        moveId: undefined,
        scoreId: number,
        txHash: undefined | string
    }
    const [leaderboardModal, setLeaderboardModal] = useState(false)
    const [tipsModal, setTipsModal] = useState(false)
    const [treasuryInfoModal, setTreasuryInfoModal] = useState(false)
    const [gameStarted, setGameStarted] = useState(false);
    const [gameSession, setGameSession] = useState(0);
    const [gameLoading, setGameLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastGameRef, setLastGameRef] = useState<GameLogic>();
    const [lastGameScore, setLastGameScore] = useState(0);
    const [lastGameMKT, setLastGameMKT] = useState(0);
    const [gameOverModal, setGameOverModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const rowsPerPage = 5;
    const [scoreTx, setScoreTx] = useState<ScoreTx[]>([]);
    const {address, chainId, isConnected} = useAccount()
    const {
        balance: treasuryBalance,
        refetch: refetchTreasuryBalance
    } = useTreasuryBalance(chainId ? Number(chainId) : undefined);
    const {chain} = useAccount()
    const {
        data: playerHighscore,
        refetch: refetchHighScore,
        setHighscore: setPlayerHighscore // Add setter function
    } = useGetPlayerHighscore();
    const {
        data: playerBalance,
        refetch: refetchBalance,
    } = useScoreTokenBalanceOfPlayer();
    const {
        inCooldown,
        remainingSeconds,
        checkCooldown
    } = usePlayerCooldown();

    const formatToFixedDecimals = (value: bigint, decimals: number, fixed: number): string => {
        const formatted = formatUnits(value, decimals); // e.g., "123.456789"
        const [intPart, decimalPart = ""] = formatted.split(".");

        // Trim or pad the decimal part to `fixed` digits
        const trimmedDecimals = decimalPart.slice(0, fixed).padEnd(fixed, "0");

        return `${intPart}.${trimmedDecimals}`;
    }
    // Format remaining time for display
    const formatRemainingTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };


    // Handle showing purchase modal
    const handleShowPurchaseModal = () => {
        setShowPurchaseModal(true);
    };

    // Handle closing purchase modal
    const handleClosePurchaseModal = () => {
        setShowPurchaseModal(false);
        // Refresh cooldown status after modal closes
        checkCooldown();
    };
    useEffect(() => {
        const interval = setInterval(refetchTreasuryBalance, 10000);
        return () => clearInterval(interval);
    }, [refetchTreasuryBalance])

    useEffect(() => {
        refetchHighScore();
        refetchBalance();

    }, [chain, refetchBalance, refetchHighScore, gameStarted]);

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
        const isMiniApp = await farcasterSdk.isInMiniApp()
        if (isMiniApp) {
            const context = await farcasterSdk.context
            farcasterUser = context.user;
            console.log('fuser is ', farcasterUser);
        }
        setGameLoading(true)
        setScoreTx([]);
        setCurrentPage(1)
        if (!address || !chainId) {
            console.log('Wallet not connected');
            return;
        }
        try {

            // const result = await startNewGameSession(address, Number(chainId));
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: address,
                    chain_id: chainId,
                    farcaster_user: farcasterUser
                })
            })
            if (!response.ok) {
                // Optionally, you can check for specific status codes
                if (response.status === 429) {
                    // Handle rate limit error
                    throw new Error('Too many requests. Please try again later.');
                }
                // Handle other errors
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
        // if user scored a new highscore, emit highscore event on-chain, also update local highscore state
        if (score == highScore) {
            // Update highscore state immediately with the new score
            console.log(`set highscore hook manually to ${score}`)
            setPlayerHighscore(score);

            // Still trigger the backend update in the background
            try {
                fetch('/api/game/score/highscore', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        player: address,
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
        checkCooldown();
    }, [address, chainId, setPlayerHighscore, checkCooldown]);

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
            const {generateTimedVerificationHash} = await import('@/lib/wasm-loader');
            const {hash, timestamp} = await generateTimedVerificationHash(
                address as string,
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
                    player: address,
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
    }, [address, chainId]);

    return (
        <div className={`flex flex-col items-center justify-start min-h-screen ${gameStarted ? '' : 'py-6'}`}>
            {chainId ? (<Leaderboard
                chainId={Number(chainId)}
                openModal={leaderboardModal}
                closeModalAction={() => setLeaderboardModal(false)}
                currentUserAddress={address}
            />) : <></>}
            <TipsModal
                show={tipsModal}
                onClose={() => setTipsModal(false)}
            />
            <TreasuryInfoModal
                show={treasuryInfoModal}
                onClose={() => setTreasuryInfoModal(false)}
            />
            <GameOverModal
                show={gameOverModal}
                onClose={finishGame}
                score={lastGameScore}
                mkt={lastGameMKT}
                highScore={playerHighscore}
            />
            {!gameStarted && (
                <div>
                    <div className="w-full max-w-[540px] mb-6">
                        <div
                            className="relative p-1 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
                            <div
                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 animate-pulse"></div>
                            <div
                                className="relative bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 rounded-xl p-6 shadow-2xl cursor-pointer transition-all duration-500 hover:shadow-yellow-500/50 hover:scale-105 hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 group"
                                onClick={() => setTreasuryInfoModal(true)}
                            >
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <span className="text-3xl mr-2 group-hover:animate-bounce">🏆</span>
                                        <h2 className="text-2xl font-bold text-yellow-900 group-hover:text-yellow-800 transition-colors duration-300">MON
                                            Treasury</h2>
                                        <span className="text-3xl ml-2 group-hover:animate-bounce">🏆</span>
                                    </div>
                                    <div
                                        className="text-4xl font-extrabold text-yellow-900 mb-2 group-hover:text-yellow-800 transition-colors duration-300">
                                        {treasuryBalance ? formatToFixedDecimals(treasuryBalance.totalBalance, 18, 2) : 0.00 } MON
                                    </div>
                                    <p className="text-yellow-800 text-sm font-medium group-hover:text-yellow-700 transition-colors duration-300">
                                        Learn more about rewards!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {isConnected && (
                        <div className="w-full max-w-[540px] mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                {/* MKT Balance Card */}
                                <div
                                    className="bg-gradient-to-br from-monad-purple to-monad-light-blue rounded-lg p-3 shadow-md">
                                    <div className="flex items-center justify-center mb-2">
                                        <img src="/images/coin.svg" alt="MKT" className="w-8 h-8 mr-2"/>
                                        <span className="text-monad-off-white font-semibold">MKT</span>
                                    </div>
                                    <div className="text-center text-1xl font-bold text-monad-off-white">
                                        {playerBalance ? (playerBalance / (BigInt(10) ** BigInt(18))).toString() : '0'}
                                    </div>
                                </div>

                                {/* Highscore Card */}
                                <div className="bg-gradient-to-br from-monad-berry to-red-600 rounded-lg p-3 shadow-md">
                                    <div className="flex items-center justify-center mb-2">
                                        <span className="text-2xl mr-2">🎯</span>
                                        <span className="text-monad-off-white font-semibold">Best</span>
                                    </div>
                                    <div className="text-center text-1xl font-bold text-monad-off-white">
                                        {playerHighscore?.toString() || '0'}
                                    </div>
                                </div>
                            </div>
                        </div>

                    )}
                </div>
            )}
            <div
                className={`relative w-full max-w-[540px] mx-auto flex items-center justify-center ${gameStarted ? 'mt-0' : 'mt-5 mb-5'}`}>
                {isConnected && gameStarted ? (
                    /* If the game has started, render the Game component */
                    <div className="w-full h-full">
                        <Game
                            sessionId={gameSession}
                            gameOverCallback={gameOverHandler}
                            scoreUpdateCallback={handleScoreUpdate}
                            highScore={playerHighscore}
                        />
                    </div>
                ) : (
                    /* Otherwise, show game controls */
                    <div className="flex items-center justify-center w-full flex-col space-y-6 px-4">
                        {isConnected ? (
                            inCooldown ? (
                                <div className="space-y-3 w-full">
                                    <div className="bg-monad-light-blue bg-opacity-20 rounded-lg p-4 text-center">
                                        <p className="text-monad-off-white mb-2">
                                            ⏰ Next climb available in
                                        </p>
                                        <div className="text-2xl font-bold text-monad-berry">
                                            {formatRemainingTime(remainingSeconds)}
                                        </div>
                                    </div>
                                    <Button
                                        color="primary"
                                        size="xl"
                                        className="bg-monad-berry rounded-md focus:outline-none focus:ring-2 w-full"
                                        onClick={handleShowPurchaseModal}
                                        disabled={gameLoading}
                                    >
                                        ⚡ Skip Wait & Play Now
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    color="primary"
                                    size="xl"
                                    className="bg-monad-berry rounded-md focus:outline-none focus:ring-2 w-full text-xl py-6"
                                    onClick={handleNewGame}
                                    disabled={gameLoading}
                                >
                                    {gameLoading ? '⚔️ Preparing...' : '🏰 Start Climbing!'}
                                </Button>
                            )
                        ) : (
                            <div className="w-full flex justify-center">
                                <ConnectButton size="md" className="transform scale-150" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/*  Tx Table - Only show when not in game */}
            {!gameStarted && scoreTx.length !== 0 && (
                <div className="w-full overflow-x-auto mt-6">
                    <Table striped className="text-monad-black font-bold">
                        <Table.Head>
                            <Table.HeadCell className="bg-purple-500">Score</Table.HeadCell>
                            <Table.HeadCell className="bg-purple-500">Tx Link</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {scoreTx.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((scoreTx, key) => (
                                <Table.Row key={key}
                                           className="hover:bg-purple-400 odd:bg-purple-200 even:bg-purple-300 odd:dark:bg-gray-800 even:dark:bg-gray-700">
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                        {scoreTx.scoreId}
                                    </Table.Cell>
                                    <Table.Cell>{
                                        scoreTx.txHash ? (
                                            <a className="underline" target="_blank"
                                               href={`${chain?.blockExplorers?.default.url ?? "http://testnet.monadexplorer.com/"}tx/${scoreTx.txHash}`}>
                                                <span
                                                    className="block sm:hidden">{`${scoreTx.txHash.slice(0, 4)}...${scoreTx.txHash.slice(-4)}`}</span>
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
                        <span className="flex items-center text-monad-off-white">
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

            {/* Action Buttons - Only show when not in game */}
            {!gameStarted && (
                <div className="flex flex-col gap-4 mt-6 w-full max-w-[540px] px-4 sm:flex-row sm:justify-center">
                    <Button
                        color="primary"
                        className="bg-monad-berry rounded-md px-6 py-3 focus:outline-none focus:ring-2 focus:ring-stone-500 text-lg"
                        onClick={() => setLeaderboardModal(true)}
                    >
                        🏆 Leaderboard
                    </Button>
                    <Button
                        color="primary"
                        className="bg-monad-berry rounded-md px-6 py-3 focus:outline-none focus:ring-2 focus:ring-stone-500 text-lg"
                        onClick={() => setTipsModal(true)}
                    >
                        📖 How to Play
                    </Button>
                </div>
            )}

            <PurchaseSessionsModal
                show={showPurchaseModal}
                onClose={handleClosePurchaseModal}
                remainingSeconds={remainingSeconds}
            />

        </div>

    );

}