
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Lock, Globe } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar usuários padrão se não existirem
    const defaultCredentials = {
      'administrador': 'admin123',
      'usuario': 'user123'
    };

    const savedCredentials = localStorage.getItem('userCredentials');
    if (!savedCredentials) {
      localStorage.setItem('userCredentials', JSON.stringify(defaultCredentials));
    } else {
      // Garantir que os usuários padrão existam
      const credentials = JSON.parse(savedCredentials);
      let updated = false;
      
      if (!credentials['administrador']) {
        credentials['administrador'] = 'admin123';
        updated = true;
      }
      
      if (!credentials['usuario']) {
        credentials['usuario'] = 'user123';
        updated = true;
      }
      
      if (updated) {
        localStorage.setItem('userCredentials', JSON.stringify(credentials));
      }
    }

    // Inicializar permissões padrão
    const defaultPermissions = {
      'usuario': {
        date: true,
        database: false,
        scripts: true,
        users: false,
        logs: true
      }
    };

    const savedPermissions = localStorage.getItem('userPermissions');
    if (!savedPermissions) {
      localStorage.setItem('userPermissions', JSON.stringify(defaultPermissions));
    }

    // Carregar personalizações
    const savedBackground = localStorage.getItem('loginBackground');
    const savedLogo = localStorage.getItem('loginLogo');
    
    if (savedBackground) setBackgroundImage(savedBackground);
    if (savedLogo) setLogoImage(savedLogo);
  }, []);

  const logAction = (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: username || 'unknown'
    };
    
    console.log('AUTH_LOG:', JSON.stringify(logEntry));
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
  };

  const handleLogin = () => {
    if (!username || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    
    if (credentials[username] && credentials[username] === password) {
      localStorage.setItem('currentUser', username);
      
      logAction('LOGIN_SUCCESS', { username });
      
      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${username}!`
      });
      
      onLogin();
    } else {
      logAction('LOGIN_FAILED', { username, reason: 'Invalid credentials' });
      
      toast({
        title: "Erro de login",
        description: "Usuário ou senha incorretos",
        variant: "destructive"
      });
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
      {/* Overlay escuro se houver imagem de fundo */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/50"></div>
      )}
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      
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
              PAINEL DE CONTROLE
            </CardTitle>
            <p className="text-slate-400 mt-2">
              Sistema de Gerenciamento Docker
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
                className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 transition-all duration-200"
          >
            Entrar
          </Button>
          
          <div className="text-center text-sm text-slate-400 mt-4">
            <p>Usuários padrão:</p>
            <p><span className="text-cyan-400">administrador</span> / admin123</p>
            <p><span className="text-green-400">usuario</span> / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
