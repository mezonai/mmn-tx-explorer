'useClient';
import { DATE_TIME_FORMAT } from '@/constant';
import { DateTimeUtil } from '@/utils';
import { format } from 'date-fns';

interface ClientTimeDisplayProps {
  timestamp: number | string;
}
export const ClientTimeDisplay = ({ timestamp }: ClientTimeDisplayProps) => {
  return <>{format(DateTimeUtil.toMilliseconds(timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}</>;
};
