import axios, { AxiosResponse } from 'axios';
import { AUTHENTICATION_ENDPOINT } from './constants';
import { LoginResponse } from './type';
import { apiDongClient } from '@/service';
import { STORAGE_KEYS } from '@/constant';
export class AuthenticationService {
  static async getUserInfo(code: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await axios.get(AUTHENTICATION_ENDPOINT.USER_INFO, {
      params: { code },
    });

    apiDongClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

    return response.data;
  }
  static async refreshLogin(refreshToken: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await apiDongClient.post(AUTHENTICATION_ENDPOINT.REFRESH, {
      refresh_token: refreshToken,
    });

    apiDongClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

    localStorage.setItem(
      STORAGE_KEYS.TOKEN,
      JSON.stringify({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      })
    );

    return response.data;
  }
}
