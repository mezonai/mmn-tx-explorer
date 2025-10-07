'use client';

import { DATE_TIME_FORMAT } from '@/constant';
import { DateTimeUtil } from '@/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
interface ClientTimeDisplayProps {
  timestamp: number | string;
}

export const ClientTimeDisplay = ({ timestamp }: ClientTimeDisplayProps) => {
  const [time, setTime] = useState<string>('');
  useEffect(() => {
    setTime(format(DateTimeUtil.toMilliseconds(timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET));
  }, [timestamp]);
  return <>{time}</>;
};
