"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setupAPIInterceptors } from "../services/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import { jwtDecode } from "jwt-decode";
import { AxiosError, AxiosResponse } from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  company_id: number;
  position?: string;
}

interface AuthContextData {
  user: User | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
  const [data, setData] = useState<{ user: User | null; token: string | null }>({
    user: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carrega os dados do usuário ao iniciar o app
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      // Verifica se estamos no lado do cliente
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("@linkCallendar:token");
      const user = localStorage.getItem("@linkCallendar:user");

      if (token && user) {
        // Verifica se o token está expirado
        if (isTokenExpired(token)) {
          signOut();
          return;
        }

        const userData = JSON.parse(user);
        
        // Configura o interceptor com o company_id
        if (userData.company_id) {
          setupAPIInterceptors(userData.company_id);
        }
        
        setData({ user: userData, token });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      signOut();
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se o token está expirado
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return true;
    }
  };

  const signIn = async ({ email, password }: SignInCredentials): Promise<void> => {
    try {
      setLoading(true);
      
      // Verifica se são as credenciais de teste
      if (email === 'admin@barbearialink.com' && password === '123456') {
        // Cria um usuário e token mock para teste
        const mockUser = {
          id: '1',
          name: 'Administrador',
          email: 'admin@barbearialink.com',
          company_id: 1,
          position: 'admin'
        };
        const mockToken = 'mock-token-123456';
        
        // Salva os dados no localStorage (apenas no cliente)
        if (typeof window !== 'undefined') {
          localStorage.setItem("@linkCallendar:user", JSON.stringify(mockUser));
          localStorage.setItem("@linkCallendar:token", mockToken);
        }
        
        // Configura o interceptor com o company_id
        setupAPIInterceptors(mockUser.company_id);
        
        setData({ user: mockUser, token: mockToken });
        
        toast.success("Login realizado com sucesso", {
          description: `Bem-vindo(a) de volta, ${mockUser.name}!`,
        });
        
        router.push("/");
        return;
      }
      
      // Faz a requisição diretamente para a API externa
      console.log('Tentando login na API externa:', 'https://api.linkcallendar.com/sessions');
      
      let token: string;
      let userData: any;
      
      try {
        // Tenta primeiro com axios
        const response = await api.post('/sessions', { email, password });
        console.log('Resposta da API (axios):', response.data);
        token = response.data.token;
        userData = response.data.user;
      } catch (axiosError) {
        console.error('Erro ao usar axios:', axiosError);
        
        // Se falhar com axios, tenta com fetch diretamente
        console.log('Tentando com fetch direto...');
      const fetchResponse = await fetch('https://api.linkcallendar.com/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Erro ao fazer login: ${fetchResponse.status}`);
      }
      
      const data = await fetchResponse.json();
      console.log('Resposta da API (fetch):', data);
        token = data.token;
        userData = data.user;
      }
      
      if (!userData || !token) {
        throw new Error("Formato de resposta inválido");
      }

      // Formata o usuário no formato esperado
      const user = {
        id: userData.id || '',
        name: userData.name || '',
        email: userData.email || '',
        company_id: userData.company_id || 1,
        position: userData.position || ''
      };

      // Salva os dados no localStorage (apenas no cliente)
      if (typeof window !== 'undefined') {
        localStorage.setItem("@linkCallendar:user", JSON.stringify(user));
        localStorage.setItem("@linkCallendar:token", token);
      }
      
      // Configura o interceptor com o company_id
      if (user.company_id) {
        setupAPIInterceptors(user.company_id);
      }
      
      setData({ user, token });

      toast.success("Login realizado com sucesso", {
        description: `Bem-vindo(a) de volta, ${user.name}!`,
      });

      router.push("/");

    } catch (error: any) {
      console.error("Erro no login:", error);
      
      let errorMessage = "Ocorreu um erro ao tentar fazer login. Tente novamente.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("@linkCallendar:token");
      localStorage.removeItem("@linkCallendar:user");
    }
    setData({ user: null, token: null });
    // Removido o redirecionamento automático para a página de Login
  };

  // Verifica se o token está expirado a cada minuto
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem("@linkCallendar:token");
      if (token && isTokenExpired(token)) {
        signOut();
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  // Adiciona um interceptor para verificar erros de autenticação
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Verificar se o erro é de autenticação (401)
        if (error.response && error.response.status === 401) {
          signOut();
        }
        return Promise.reject(error);
      }
    );

    // Limpar interceptor quando o componente for desmontado
    return () => {
      if (interceptor !== undefined) {
        api.interceptors.response.eject(interceptor);
      }
    };
  }, [router]);

  // Valor do contexto
  const contextValue = {
    signIn,
    signOut,
    user: data.user,
    isAuthenticated: !!data.user,
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuth };
