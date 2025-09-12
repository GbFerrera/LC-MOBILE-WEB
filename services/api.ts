import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Criando a instância do axios
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3131',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Adicionar company_id aos headers de todas as requisições
const setupAPIInterceptors = (companyId: number): number => {
  return api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Adicionar company_id ao header se existir
      if (companyId) {
        // Garantindo que os headers existam
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        // Adicionando o company_id ao header
        config.headers.set('company_id', String(companyId));
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );
};

export { api, setupAPIInterceptors };