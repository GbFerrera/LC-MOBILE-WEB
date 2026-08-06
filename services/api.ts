import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Criando a instância do axios
const api: AxiosInstance = axios.create({
 baseURL: process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL 
  : "https://api.linkcallendar.com",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let requestInterceptorId: number | null = null;

const resetAPIInterceptors = (): void => {
  if (requestInterceptorId !== null) {
    api.interceptors.request.eject(requestInterceptorId);
    requestInterceptorId = null;
  }
};

// Adicionar company_id aos headers de todas as requisições
const setupAPIInterceptors = (companyId: number): void => {
  resetAPIInterceptors();

  requestInterceptorId = api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (companyId) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('company_id', String(companyId));
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );
};

export { api, setupAPIInterceptors, resetAPIInterceptors };