
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Lock, Globe } from 'lucide-react';
import DateTime from '@/components/DateTime';
import { getApiEndpoint } from '@/utils/apiEndpoints';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [title, setTitle] = useState('PAINEL DE CONTROLE');
  const [subtitle, setSubtitle] = useState('Sistema de Gerenciamento Docker');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomizations();
  }, []);

  const loadCustomizations = async () => {
    try {
      const customizationsUrl = getApiEndpoint('/api/customizations');
      console.log('🔄 Carregando personalizações do servidor:', customizationsUrl);
      
      const response = await fetch(customizationsUrl);
      if (response.ok) {
        const customizations = await response.json();
        console.log('✅ Personalizações carregadas:', customizations);
        
        if (customizations.background) setBackgroundImage(customizations.background);
        if (customizations.logo) setLogoImage(customizations.logo);
        if (customizations.title) setTitle(customizations.title);
        if (customizations.subtitle) setSubtitle(customizations.subtitle);
        if (customizations.favicon) {
          updateFavicon(customizations.favicon);
        }
        
        // Atualizar título da página
        document.title = customizations.title || 'PAINEL DE CONTROLE';
      } else {
        console.warn('❌ Não foi possível carregar personalizações, usando configurações padrão');
        // Usar configurações padrão
        const envTitle = import.meta.env.VITE_SYSTEM_TITLE;
        const envSubtitle = import.meta.env.VITE_SYSTEM_SUBTITLE;
        if (envTitle) setTitle(envTitle);
        if (envSubtitle) setSubtitle(envSubtitle);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar personalizações:', error);
      // Usar configurações padrão em caso de erro
      const envTitle = import.meta.env.VITE_SYSTEM_TITLE || 'PAINEL DEV';
      const envSubtitle = import.meta.env.VITE_SYSTEM_SUBTITLE || 'Sistema de Gerenciamento Docker';
      setTitle(envTitle);
      setSubtitle(envSubtitle);
    }
  };

  const updateFavicon = (faviconUrl: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const loginUrl = getApiEndpoint('/api/auth/login');
      console.log('🔐 Tentando login no backend:', loginUrl);
      console.log('🔐 Dados de login:', { username, password: '***' });
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      console.log('🔐 Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔐 Dados de resposta:', data);

      if (data.success) {
        // Salvar dados do usuário
        localStorage.setItem('currentUser', username);
        localStorage.setItem('userPermissions', JSON.stringify(data.permissions || {}));
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('✅ Login realizado com sucesso');
        
        toast({
          title: "Login realizado!",
          description: `Bem-vindo, ${username}!`
        });
        
        onLogin();
      } else {
        console.warn('❌ Falha no login:', data.error);
        toast({
          title: "Erro de login",
          description: data.error || "Usuário ou senha incorretos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro de conexão:', error);
      toast({
        title: "Erro de conexão",
        description: `Não foi possível conectar ao servidor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/50"></div>
      )}
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      
      <div className="absolute top-4 right-4 z-20">
        <DateTime className="text-white bg-slate-800/50 backdrop-blur-lg rounded-lg px-3 py-2" />
      </div>
      
      <Card className="w-full max-w-md mx-4 bg-slate-800/90 backdrop-blur-lg border-cyan-500/30 shadow-2xl shadow-cyan-500/20 relative z-10">
        <CardHeader className="space-y-4 pb-6">
          {logoImage ? (
            <div className="flex justify-center">
              <img 
                src={logoImage} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          
          <div className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {title}
            </CardTitle>
            <p className="text-slate-400 mt-2">
              {subtitle}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 transition-all duration-200"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          
          <div className="text-center text-sm text-slate-400 mt-4">
            <p>Usuários padrão:</p>
            <p><span className="text-cyan-400">administrador</span> / {import.meta.env.VITE_ADMIN_PASSWORD || '123admin'}</p>
            <p><span className="text-green-400">usuario</span> / {import.meta.env.VITE_USER_PASSWORD || '123user'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
