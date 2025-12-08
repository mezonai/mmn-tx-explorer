import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    meta?: {
      authOptional?: boolean;
    };
  }
}