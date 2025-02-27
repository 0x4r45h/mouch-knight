'use client';

import {Button, Modal, Table} from "flowbite-react";
import React, {useEffect, useState} from 'react';


interface LeaderboardProps {
    openModal: boolean;
    closeModalAction: () => void;
    chainId: number;
}
export const Leaderboard: React.FC<LeaderboardProps> = ({openModal, closeModalAction, chainId}) => {
    type Score = {
        address: string,
        score: string
    }
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const [scores, setScores] = useState<Score[]>([]);

    useEffect(() => {
        if (openModal) {
            const fetchHighscores = async () => {
                try {
                    const response = await fetch(`/api/game/score/highscore?chain_id=${chainId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })

                    if (!response.ok) {
                        console.error(`couldn't fetch leaderboard`, response);
                        return;
                    }
                    const result = await response.json();
                    const leaderboard = result.data.leaderboard;
                    const highScores = leaderboard.map((value: {player: string, score: string}) => {
                        const score: Score = {
                            address: value.player,
                            score: value.score,
                        }
                        return score;
                    })
                    setScores(highScores);
                    console.log('Result is ', result)

                } catch (error) {
                    console.error('Error during submit score:', error);
                }
            }
            fetchHighscores()
        }

    }, [chainId, openModal]);
    return (
        <>
            <Modal show={openModal} onClose={closeModalAction}>
                <Modal.Header>Leaderboard</Modal.Header>
                <Modal.Body>
                    <div className="w-full overflow-x-auto">
                        <Table striped>
                            <Table.Head>
                                <Table.HeadCell>Rank</Table.HeadCell>
                                <Table.HeadCell>Address</Table.HeadCell>
                                <Table.HeadCell>Score</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {scores.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((scores, key: number) => (
                                    <Table.Row key={key} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell>
                                            <span className="block">{((currentPage - 1) * rowsPerPage) + key+1}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="block sm:hidden">{`${scores.address.slice(0, 4)}...${scores.address.slice(-4)}`}</span>
                                            <span className="hidden sm:block">{scores.address}</span>

                                        </Table.Cell>
                                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                            {scores.score}
                                        </Table.Cell>

                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer className="flex justify-between">
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
    Page {currentPage} of {Math.ceil(scores.length / rowsPerPage)}
  </span>
                        <Button
                            size="lg"
                            color="primary"
                            className="rounded disabled:opacity-50"
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage * rowsPerPage >= scores.length}
                        >
                            Next
                        </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default Leaderboard;
