'use client';

import { useEffect, useState } from 'react';
import MaintenanceModal from './MaintenanceModal';

const MaintenanceCheck = () => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    useEffect(() => {
        // Check for maintenance mode from environment variable
        // In Next.js, client-side environment variables must be prefixed with NEXT_PUBLIC_
        setIsMaintenanceMode(process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true');
    }, []);

    if (!isMaintenanceMode) return null;

    return <MaintenanceModal />;
};

export default MaintenanceCheck;