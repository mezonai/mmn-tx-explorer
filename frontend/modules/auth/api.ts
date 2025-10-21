import axios, { AxiosResponse } from 'axios';
import { AUTHENCATION_ENDPOINT } from './constants';
import { LoginResponse } from './type';
export class AuthenticationService {
  static async getUserInfo(code: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await axios.get(AUTHENCATION_ENDPOINT.USER_INFO, {
      params: { code },
    });
    return response.data;
  }
}
