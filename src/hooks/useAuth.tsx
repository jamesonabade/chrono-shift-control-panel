
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, serverApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkServerConnection = async () => {
    try {
      console.log('🔍 Verificando conexão com servidor...');
      await serverApi.getServerTime();
      console.log('✅ Servidor conectado');
      return true;
    } catch (error) {
      console.error('❌ Erro de conexão com servidor:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      // Primeiro verificar se o servidor está online
      const serverOnline = await checkServerConnection();
      if (!serverOnline) {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('🔍 Nenhum token encontrado');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Verificando autenticação...');
      const response = await authApi.me();
      console.log('✅ Resposta da verificação de auth:', response.data);
      
      if (response.data.success && response.data.data) {
        setUser(response.data.data.user);
        console.log('👤 Usuário autenticado:', response.data.data.user);
      } else {
        console.log('❌ Token inválido, removendo...');
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('❌ Erro na verificação de auth:', error);
      localStorage.removeItem('authToken');
      toast({
        title: "Erro de autenticação",
        description: "Sessão expirada, faça login novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Tentando fazer login com:', { email, password: '***' });
      
      // Verificar conexão primeiro
      const serverOnline = await checkServerConnection();
      if (!serverOnline) {
        return false;
      }
      
      const response = await authApi.login(email, password);
      console.log('📡 Resposta do login:', response.data);
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        localStorage.setItem('authToken', token);
        setUser(userData);
        
        console.log('✅ Login realizado com sucesso:', userData);
        
        toast({
          title: "Login realizado!",
          description: `Bem-vindo, ${userData.name}!`,
        });
        
        return true;
      } else {
        console.log('❌ Login falhou:', response.data.message);
        toast({
          title: "Erro no login",
          description: response.data.message || "Credenciais inválidas",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      let errorMessage = "Erro interno do servidor";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = "Erro de conexão com o servidor";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await authApi.logout();
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      console.log('✅ Logout realizado');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
