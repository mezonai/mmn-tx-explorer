import { TransferInput, TransferResult } from '../types';
import { useMmn } from './useMmn';

export const useTransfer = () => {
  const hardcodedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJlNzZiMDliMC1lMjU5LTQ5NWMtODQ3YS1hOWI4Y2VkOGY1ZjciLCJ1aWQiOjE5NjUzNTMzNDYyNjkxODgwOTYsInVzbiI6ImF0aHVyNGMiLCJleHAiOjE3NjAwMDQ1NDd9.8v78Evj_pytUKBJtPfIzmqKokXV5RedGgbJNHxh6SqE"
  const userId = '1965353346269188096';

  const {execute,loading, result} = useMmn({
    token: hardcodedToken,
    userId
  })
  const transfer = async (input: TransferInput) => {
    const res = await execute(input);
    return res; 
    
  };
  return { transfer, loading, result };
};
