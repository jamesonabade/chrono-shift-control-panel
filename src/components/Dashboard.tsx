
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Calendar, Database, Upload, Users, FileText } from 'lucide-react';
import DateSelector from '@/components/DateSelector';
import DatabaseRestore from '@/components/DatabaseRestore';
import ScriptUpload from '@/components/ScriptUpload';
import UserManagement from '@/components/UserManagement';
import SystemLogs from '@/components/SystemLogs';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const currentUser = localStorage.getItem('currentUser') || 'admin';
  const isAdmin = currentUser === 'admin';

  // Definir quais abas cada tipo de usuário pode acessar
  const getUserTabs = () => {
    const baseTabs = [
      { value: 'date', label: 'Data', icon: Calendar, adminOnly: false },
      { value: 'scripts', label: 'Scripts', icon: Upload, adminOnly: false },
      { value: 'logs', label: 'Logs', icon: FileText, adminOnly: false }
    ];

    const adminTabs = [
      { value: 'database', label: 'Banco', icon: Database, adminOnly: true },
      { value: 'users', label: 'Usuários', icon: Users, adminOnly: true }
    ];

    if (isAdmin) {
      return [...baseTabs.slice(0, 1), ...adminTabs.slice(0, 1), ...baseTabs.slice(1), ...adminTabs.slice(1)];
    }

    return baseTabs;
  };

  const userTabs = getUserTabs();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      
      {/* Header */}
      <div className="relative z-10 border-b border-cyan-500/30 bg-slate-800/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              PAINEL DE CONTROLE
            </h1>
            <p className="text-sm text-slate-400">
              🐳 Docker | Usuário: {currentUser} {isAdmin && '(Admin)'}
            </p>
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
        <Tabs defaultValue="date" className="w-full">
          <TabsList className={`grid w-full grid-cols-${userTabs.length} bg-slate-800/50 backdrop-blur-lg border border-cyan-500/30`}>
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

          {isAdmin && (
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

          {isAdmin && (
            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="logs" className="mt-6">
            <SystemLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
