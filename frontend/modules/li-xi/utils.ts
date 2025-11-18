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