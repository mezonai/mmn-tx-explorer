import { ECampaignStatus } from './type';

const getCampaignStatusLabel = (status: ECampaignStatus) => {
  switch (status) {
    case ECampaignStatus.Active:
      return 'Active';
    case ECampaignStatus.Draft:
      return 'Draft';
    case ECampaignStatus.Closed:
      return 'Closed';
    default:
      return 'Unknown';
  }
};

const getCampaignStatusVariant = (status: ECampaignStatus) => {
  switch (status) {
    case ECampaignStatus.Active:
      return `success`;
    case ECampaignStatus.Draft:
      return `warning`;
    case ECampaignStatus.Closed:
      return `error`;
    default:
      return `default`;
  }
};
const truncateWalletAddress = (address: string, chars = 6) => {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

// highlight occurrences of a query inside the text (case-insensitive)
// returns an array of strings and JSX elements (so you can render directly)
const highlightMatches = (text: string | undefined | null, query?: string) => {
  if (!text) return text;
  if (!query || query.trim() === '') return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: (string | JSX.Element)[] = [];
  let start = 0;
  let idx = lowerText.indexOf(lowerQuery, start);
  while (idx !== -1) {
    if (idx > start) {
      parts.push(text.substring(start, idx));
    }
    const match = text.substring(idx, idx + lowerQuery.length);
    // Mark matched text
    parts.push(
      // use span instead of mark so styles can be applied consistently
      <span key={`${idx}-${match}`} className="rounded bg-yellow-200/70 px-0.5 py-[1px] dark:bg-yellow-400/30">
        {match}
      </span>
    );
    start = idx + lowerQuery.length;
    idx = lowerText.indexOf(lowerQuery, start);
  }
  if (start < text.length) {
    parts.push(text.substring(start));
  }
  return parts;
};
export { getCampaignStatusLabel, getCampaignStatusVariant, truncateWalletAddress, highlightMatches };
