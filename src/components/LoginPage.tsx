
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(localStorage.getItem('loginBackground') || '');
  const [logo, setLogo] = useState(localStorage.getItem('loginLogo') || '');
  const [showCustomization, setShowCustomization] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Credenciais padrão + usuários criados
    const defaultCredentials = { admin: 'admin123' };
    const userCredentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    const allCredentials = { ...defaultCredentials, ...userCredentials };

    if (allCredentials[username] && allCredentials[username] === password) {
      localStorage.setItem('currentUser', username);
      onLogin();
      
      logAction('LOGIN_SUCCESS', { username });
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo ao Sistema de Gerenciamento de Eventos, ${username}!`
      });
    } else {
      logAction('LOGIN_FAILED', { username, reason: 'invalid_credentials' });
      
      toast({
        title: "Erro de autenticação",
        description: "Usuário ou senha incorretos",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (file: File, type: 'background' | 'logo') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'background') {
        setBackgroundImage(result);
        localStorage.setItem('loginBackground', result);
      } else {
        setLogo(result);
        localStorage.setItem('loginLogo', result);
      }
      
      toast({
        title: "Imagem carregada!",
        description: `${type === 'background' ? 'Papel de parede' : 'Logo'} atualizado`,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'background' | 'logo') => {
    if (type === 'background') {
      setBackgroundImage('');
      localStorage.removeItem('loginBackground');
    } else {
      setLogo('');
      localStorage.removeItem('loginLogo');
    }
    
    toast({
      title: "Imagem removida!",
      description: `${type === 'background' ? 'Papel de parede' : 'Logo'} removido`,
    });
  };

  const backgroundStyle = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative"
      style={backgroundStyle}
    >
      {/* Overlay para melhor legibilidade */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      )}
      
      {!backgroundImage && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      )}
      
      {/* Botão de personalização */}
      <Button
        onClick={() => setShowCustomization(!showCustomization)}
        className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 hover:bg-slate-700/80 z-20"
        variant="outline"
        size="sm"
      >
        🎨 Personalizar
      </Button>

      {/* Painel de personalização */}
      {showCustomization && (
        <div className="absolute top-16 right-4 bg-slate-800/90 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 space-y-4 z-20 min-w-[300px]">
          <h3 className="text-white font-semibold">Personalização do Login</h3>
          
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Papel de Parede</label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'background');
                }}
                className="bg-slate-700/50 border-slate-600 text-white text-xs"
              />
              {backgroundImage && (
                <Button
                  onClick={() => removeImage('background')}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Logo</label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'logo');
                }}
                className="bg-slate-700/50 border-slate-600 text-white text-xs"
              />
              {logo && (
                <Button
                  onClick={() => removeImage('logo')}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 shadow-2xl shadow-cyan-500/20 relative z-10">
        <CardHeader className="text-center">
          {logo && (
            <div className="mb-4">
              <img src={logo} alt="Logo" className="h-16 mx-auto object-contain" />
            </div>
          )}
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            SISTEMA DE EVENTOS
          </CardTitle>
          <p className="text-slate-400 text-sm">Gerenciamento Futurístico</p>
          <div className="text-xs text-cyan-400 bg-slate-700/50 px-2 py-1 rounded-full inline-block">
            🐳 Docker Ready
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30"
            >
              ACESSAR SISTEMA
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Usuário padrão: admin | Senha: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
