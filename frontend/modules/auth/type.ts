export interface LoginResponse {
  access_token: string;
  auth_token: string;
  refresh_token: string;
  user: UserInfoResponse;
}
export interface UserInfoResponse {
  aud: string[];
  auth_time: number;
  avatar: string;
  display_name: string;
  email: string;
  iat: number;
  iss: string;
  mezon_id: string;
  rat: number;
  sub: string;
  user_id: string;
  username: string;
}
export interface StateObject {
  csrf: string;
  redirect_url: string;
}
