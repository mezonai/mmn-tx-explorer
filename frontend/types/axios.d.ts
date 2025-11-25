import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    meta?: {
      noAuth?: boolean;
    };
  }
}