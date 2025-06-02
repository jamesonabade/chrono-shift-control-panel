import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Calendar, Database, Upload, Users, FileText, Globe } from 'lucide-react';
import DateSelector from '@/components/DateSelector';
import DatabaseRestore from '@/components/DatabaseRestore';
import ScriptUpload from '@/components/ScriptUpload';
import UserManagement from '@/components/UserManagement';
import SystemLogs from '@/components/SystemLogs';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [title, setTitle] = useState('PAINEL DE CONTROLE');
  const currentUser = localStorage.getItem('currentUser') || 'administrador';
  const isAdmin = currentUser === 'administrador';

  useEffect(() => {
    // Carregar personalizações
    const loadCustomizations = () => {
      const savedBackground = localStorage.getItem('loginBackground');
      const savedLogo = localStorage.getItem('loginLogo');
      const savedTitle = localStorage.getItem('loginTitle');
      
      if (savedBackground) setBackgroundImage(savedBackground);
      if (savedLogo) setLogoImage(savedLogo);
      if (savedTitle) setTitle(savedTitle);
    };

    loadCustomizations();

    // Escutar mudanças nas personalizações
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loginBackground') {
        setBackgroundImage(e.newValue || '');
      } else if (e.key === 'loginLogo') {
        setLogoImage(e.newValue || '');
      } else if (e.key === 'loginTitle') {
        setTitle(e.newValue || 'PAINEL DE CONTROLE');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar mudanças a cada segundo (para mudanças na mesma aba)
    const interval = setInterval(loadCustomizations, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Definir permissões por usuário
  const getUserPermissions = () => {
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    
    // Permissões padrão para administrador - SEMPRE TODAS
    if (currentUser === 'administrador') {
      return {
        date: true,
        database: true,
        scripts: true,
        users: true,
        logs: true
      };
    }

    // Permissões para usuário comum (padrão)
    if (currentUser === 'usuario') {
      return userPermissions[currentUser] || {
        date: true,
        database: false,
        scripts: true,
        users: false,
        logs: true
      };
    }

    // Permissões para outros usuários criados
    return userPermissions[currentUser] || {
      date: true,
      database: false,
      scripts: true,
      users: false,
      logs: false
    };
  };

  const permissions = getUserPermissions();

  // Definir abas baseadas nas permissões
  const getAllTabs = () => [
    { value: 'date', label: 'Data', icon: Calendar, permission: 'date' },
    { value: 'database', label: 'Banco', icon: Database, permission: 'database' },
    { value: 'scripts', label: 'Scripts', icon: Upload, permission: 'scripts' },
    { value: 'users', label: 'Usuários', icon: Users, permission: 'users' },
    { value: 'logs', label: 'Logs', icon: FileText, permission: 'logs' }
  ];

  const userTabs = getAllTabs().filter(tab => permissions[tab.permission]);

  const handleLogout = () => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'LOGOUT',
      details: { username: currentUser },
      user: currentUser
    };
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));

    localStorage.removeItem('currentUser');
    onLogout();
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative"
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
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      
      {/* Header */}
      <div className="relative z-10 border-b border-cyan-500/30 bg-slate-800/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {logoImage ? (
              <img 
                src={logoImage} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-slate-400">
                🐳 Docker | Usuário: {currentUser} {isAdmin && '(Admin)'}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <Tabs defaultValue={userTabs[0]?.value || 'date'} className="w-full">
          <TabsList className="grid w-full bg-slate-800/50 backdrop-blur-lg border border-cyan-500/30" style={{ gridTemplateColumns: `repeat(${userTabs.length}, 1fr)` }}>
            {userTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="data-[state=active]:bg-cyan-500/20"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {permissions.date && (
            <TabsContent value="date" className="mt-6">
              <Card className="bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 shadow-xl shadow-cyan-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-400 flex items-center">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                    Configuração de Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DateSelector />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {permissions.database && (
            <TabsContent value="database" className="mt-6">
              <Card className="bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 shadow-xl shadow-cyan-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-400 flex items-center">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                    Restauração de Banco (Admin)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DatabaseRestore />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {permissions.scripts && (
            <TabsContent value="scripts" className="mt-6">
              <Card className="bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 shadow-xl shadow-cyan-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-400 flex items-center">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                    Scripts de Administração
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScriptUpload />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {permissions.users && (
            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}

          {permissions.logs && (
            <TabsContent value="logs" className="mt-6">
              <SystemLogs />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
