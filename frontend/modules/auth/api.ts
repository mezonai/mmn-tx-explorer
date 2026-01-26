import axios, { AxiosResponse } from 'axios';
import { AUTHENTICATION_ENDPOINT } from './constants';
import { LoginResponse } from './type';
import { STORAGE_KEYS } from '@/constant';
import { authClient } from '@/service';
export class AuthenticationService {
  private static refreshPromise: Promise<LoginResponse> | null = null;

  static async getUserInfo(code: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await axios.get(AUTHENTICATION_ENDPOINT.USER_INFO, {
      params: { code },
    });
    return response.data;
  }
  static async refreshLogin(refreshToken: string): Promise<LoginResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response: AxiosResponse<LoginResponse> = await authClient.post(AUTHENTICATION_ENDPOINT.REFRESH, {
          refresh_token: refreshToken,
        });

        localStorage.setItem(
          STORAGE_KEYS.TOKEN,
          JSON.stringify({
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
          })
        );

        return response.data;
      } catch (error) {
        console.error('[AuthService] API Refresh returned error:', error);
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  static getIsRefreshing(): boolean {
    return !!this.refreshPromise;
  }

  static async waitRefresh(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;
    }
  }
}
