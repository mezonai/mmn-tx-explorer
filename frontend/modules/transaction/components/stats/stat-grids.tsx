'use client';

import { useEffect, useState } from 'react';

import { DashboardService, IDashboardStats } from '@/modules/dashboard';
import { StatCardSkeleton } from './stat-card-skeleton';
import { StatsGrid } from './stat-grid';

export const StatGrids = () => {
  const [stats, setStats] = useState<IDashboardStats>();

  const handleFetchStats = async () => {
    try {
      const { data } = await DashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {stats ? (
        <StatsGrid stats={stats} />
      ) : (
        Array.from({ length: 2 }).map((_, index) => <StatCardSkeleton key={index} />)
      )}
    </div>
  );
};
