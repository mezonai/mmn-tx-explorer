import { useEffect, useState } from 'react';

export const Countdown = ({ expiresAt }: { expiresAt?: string | number | Date }) => {
    const getMs = (v?: string | number | Date) => {
        if (!v) return 0;
        const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v;
        const t = d instanceof Date && !isNaN(d.getTime()) ? d.getTime() : 0;
        return Math.max(0, t - Date.now());
    };

    const [remainingMs, setRemainingMs] = useState(() => getMs(expiresAt));

    useEffect(() => {
        setRemainingMs(getMs(expiresAt));
        const id = setInterval(() => {
            const ms = getMs(expiresAt);
            setRemainingMs(ms);
            if (ms <= 0) clearInterval(id);
        }, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const fmt = (ms: number) => {
        if (ms <= 0) return 'Expired!';
        const sec = Math.floor(ms / 1000);
        const days = Math.floor(sec / 86400);
        const hours = Math.floor((sec % 86400) / 3600);
        const minutes = Math.floor((sec % 3600) / 60);
        const seconds = sec % 60;
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const className = remainingMs <= 0 ? 'text-error-primary-600 font-bold' : 'text-utility-success-600 font-bold';

    return <p className={className}>{fmt(remainingMs)}</p>;
};
