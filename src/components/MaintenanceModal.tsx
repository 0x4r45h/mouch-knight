import React from 'react';
import { Modal} from "flowbite-react";

const MaintenanceModal: React.FC = () => {
    return (
        <Modal show={true} >
            <Modal.Header className="text-indigo-700 dark:text-indigo-400">The Break Monad is Taking a Pause ⏸️</Modal.Header>
            <Modal.Body>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        <span className="text-amber-600 dark:text-amber-400">🛡️ Our Knight is on a Well-Deserved Break</span>
                    </h3>
                    <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                        The Break Monad program has been <span className="font-medium text-blue-600 dark:text-blue-400">temporarily suspended</span> for a few weeks. We'll bring the website back online as soon as the event resumes, with <span className="font-medium text-green-600 dark:text-green-400">improved UX and performance</span>!
                    </p>
                    <p className="text-sm italic text-purple-600 dark:text-purple-400">
                        ✨ Thank you for your patience and continued support! ✨
                    </p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="w-full text-center text-gray-500 dark:text-gray-400">
                    🔔 Follow us on X at <a target="_blank" rel="noopener noreferrer" href="https://x.com/Ember_Stake" className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">@Ember_Stake</a> for updates! 🔔

                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default MaintenanceModal;