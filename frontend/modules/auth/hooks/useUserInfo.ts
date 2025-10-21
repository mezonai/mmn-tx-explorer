import { useQuery } from '@tanstack/react-query';
import { AuthenticationService } from '../api';

export const useUserInfo = (code: string) => {
  const { data: userInfo } = useQuery({
    queryKey: ['userInfo'],
    queryFn: () => AuthenticationService.getUserInfo(code),
  });
  return userInfo;
};
