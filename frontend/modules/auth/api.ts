import axios, { AxiosResponse } from 'axios';
import { AUTHENCATION_ENDPOINT } from './constants';
import { UserInfo } from './type';
export class AuthenticationService {
  static async getUserInfo(): Promise<UserInfo> {
    const response: AxiosResponse<UserInfo> = await axios.get(AUTHENCATION_ENDPOINT.USER_INFO);
    return response.data;
  }
}
