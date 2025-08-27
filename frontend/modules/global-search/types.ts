import { IBlock } from '../block';
import { ITransaction } from '../transaction';

export interface ISearchResult {
  blocks: IBlock[];
  transactions: ITransaction[];
  type: 'block' | 'transaction';
}
