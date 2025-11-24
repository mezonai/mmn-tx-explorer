export type VisualStatus = 'live' | 'pending' | 'closed' | 'failed';

export const getVisualStatus = (apiStatus: string): VisualStatus => {
  switch (apiStatus.toLowerCase()) {
    case 'published':
      return 'live';
    case 'pending':
      return 'pending';
    case 'failed':
      return 'failed';
    case 'expired':
      return 'closed';
    default:
      return 'closed';
  }
};

export const formatClaimDate = (
  dateString: string | undefined,
  showTime: boolean = false
): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };

    let formattedDate = date.toLocaleDateString('en-US', options);

    if (showTime) {
      const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      formattedDate = `${formattedDate} · ${time}`;
    }

    return formattedDate;
  } catch (error) {
    console.error('Invalid date format:', dateString, error);
    return dateString;
  }
};

export const truncateWalletAddress = (address: string, chars = 6): string => {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

export const getStatusDisplay = (status: string | undefined): {
  text: string;
  className: string;
} => {
  switch (status?.toLowerCase()) {
    case 'published':
      return {
        text: 'Live',
        className: `border bg-green-100 text-green-700 border-gray-200 
          dark:border-gray-900 dark:bg-[rgb(34_197_94_/_0.1)] dark:text-green-400`,
      };
    case 'expired':
      return {
        text: 'Closed',
        className: `border bg-yellow-100 text-yellow-700 border-gray-200 
          dark:border-gray-600 dark:bg-yellow-700/30 dark:text-yellow-400`,
      };
    case 'failed':
      return {
        text: 'Failed',
        className: `border bg-red-100 text-red-700 border-gray-200 
          dark:border-gray-900 dark:bg-[rgb(239_68_68_/_0.1)] dark:text-red-400`,
      };
    default:
      return {
        text: status ? status.charAt(0).toUpperCase() + status.slice(1) : '',
        className: `border bg-gray-100 text-gray-700 border-gray-200 
          dark:border-gray-600 dark:bg-gray-700/30 dark:text-gray-400`,
      };
  }
};