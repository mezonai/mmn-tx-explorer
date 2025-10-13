import { useQuery } from '@tanstack/react-query';
import { AuthenticationService } from '../api';

export const useUserInfo = () => {
  const { data: userInfo } = useQuery({
    queryKey: ['userInfo'],
    queryFn: AuthenticationService.getUserInfo,
  });
  return userInfo;
};
