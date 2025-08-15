export function formatAddress(address: string, length: number = 6): string {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatHash(hash: string, length: number = 8): string {
  if (!hash) return '';
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function formatEth(
  value: string | number,
  decimals: number = 6
): string {
  if (!value) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

export function formatRelativeTime(timeString: string): string {
  const now = new Date();
  const time = new Date(timeString);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Success':
      return 'text-green-600 dark:text-green-400';
    case 'Failed':
      return 'text-red-600 dark:text-red-400';
    case 'Pending':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'Token transfer':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'Coin transfer':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'Contract interaction':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function isValidBlockNumber(block: string): boolean {
  return /^\d+$/.test(block);
}

export function parseSearchQuery(query: string): {
  type: 'address' | 'hash' | 'block' | 'token' | 'unknown';
  value: string;
} {
  const trimmedQuery = query.trim();

  if (isValidEthAddress(trimmedQuery)) {
    return { type: 'address', value: trimmedQuery };
  }

  if (isValidTxHash(trimmedQuery)) {
    return { type: 'hash', value: trimmedQuery };
  }

  if (isValidBlockNumber(trimmedQuery)) {
    return { type: 'block', value: trimmedQuery };
  }

  if (trimmedQuery.length > 0) {
    return { type: 'token', value: trimmedQuery };
  }

  return { type: 'unknown', value: trimmedQuery };
}
