import { IBlock } from '../block';
import { ITransaction } from '../transaction';
import { IWallet } from '../wallet';

export interface ISearchResult {
  blocks: IBlock[];
  transactions: ITransaction[];
  wallets: IWallet[];
  type: 'block' | 'transaction';
}
