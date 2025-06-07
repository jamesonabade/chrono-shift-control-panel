import { useState, useEffect } from 'react';
import { Calendar, Database, FileCode, FileText, Upload, Users, User, Power, Terminal, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DateSelector from '@/components/DateSelector';
import DatabaseRestore from '@/components/DatabaseRestore';
import ScriptUpload from '@/components/ScriptUpload';
import UserManagement from '@/components/UserManagement';
import SystemLogs from '@/components/SystemLogs';
import CommandManager from '@/components/CommandManager';
import SystemConfiguration from '@/components/SystemConfiguration';
import DateTime from '@/components/DateTime';
import { api } from '@/lib/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('date');
  const [customLogo, setCustomLogo] = useState('');
  const [logoSize, setLogoSize] = useState(48);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);

  useEffect(() => {
    // Carregar personalizações do servidor
    loadCustomizations();
  }, []);

  const loadCustomizations = async () => {
    try {
      const response = await api.get('/customizations');
      if (response.data.success && response.data.data) {
        const customizations = response.data.data;

        // Aplicar logo
        if (customizations.logo) {
          setCustomLogo(customizations.logo);
          setLogoSize(customizations.logoSize || 48);
        }

        // Aplicar background com transparência configurável
        if (customizations.background) {
          const opacity = customizations.backgroundOpacity !== undefined ? customizations.backgroundOpacity : 0.5;
          setBackgroundOpacity(opacity);

          // Aplicar fundo na body
          document.body.style.backgroundImage = `url(${customizations.background})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundAttachment = 'fixed';
          document.body.style.backgroundRepeat = 'no-repeat';

          // Aplicar transparência no dashboard
          applyBackgroundOpacity(opacity);
        }

        // Aplicar título
        if (customizations.title) {
          document.title = customizations.title;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar personalizações:', error);
    }
  };

  const applyBackgroundOpacity = (opacity: number) => {
    const dashboardElement = document.getElementById('dashboard-main');
    if (dashboardElement) {
      dashboardElement.style.backgroundColor = `rgba(15, 23, 42, ${1 - opacity})`;
      dashboardElement.style.backdropFilter = 'blur(2px)';
    }
  };

  // Sistema de permissões baseado no role do usuário
  const getUserPermissions = () => {
    if (!user) return {};
    
    if (user.role === 'ADMIN') {
      return {
        date: true,
        database: true,
        scripts: true,
        commands: true,
        users: true,
        logs: true,
        config: true
      };
    } else {
      // Usuário comum tem acesso limitado
      return {
        date: true,
        database: false,
        scripts: true,
        commands: false,
        users: false,
        logs: true,
        config: false
      };
    }
  };

  const permissions = getUserPermissions();

  const renderContent = () => {
    switch (activeTab) {
      case 'date':
        return permissions.date ? <DateSelector /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      case 'database':
        return permissions.database ? <DatabaseRestore /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      case 'scripts':
        return permissions.scripts ? <ScriptUpload /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      case 'commands':
        return permissions.commands ? <CommandManager /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      case 'users':
        return permissions.users ? <UserManagement /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      case 'logs':
        return permissions.logs ? <SystemLogs /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      case 'config':
        return permissions.config ? <SystemConfiguration /> : <div className="p-6 text-center text-slate-400">Sem permissão para acessar esta seção</div>;
      default:
        return <DateSelector />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div id="dashboard-main" className="flex min-h-screen w-full text-white relative" style={{
      backgroundColor: `rgba(15, 23, 42, ${1 - backgroundOpacity})`,
      backdropFilter: 'blur(2px)'
    }}>
      {/* Sidebar */}
      <div className="w-64 bg-slate-800/70 backdrop-blur-sm border-r border-slate-700/50 flex flex-col relative z-10 min-h-screen">
        <div className="p-4 border-b border-slate-700/50 flex flex-col space-y-2">
          {customLogo ? (
            <div className="flex items-center justify-center">
              <img src={customLogo} alt="Logo" className="object-contain" style={{
                height: `${logoSize}px`
              }} />
            </div>
          ) : (
            <div className="text-xl font-semibold text-white text-center">
              Painel de Controle
            </div>
          )}
          <DateTime className="text-xs text-center" />
        </div>
        
        <div className="p-4 space-y-2 flex-1">
          {permissions.date && (
            <button
              onClick={() => setActiveTab('date')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'date' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Data
            </button>
          )}
          
          {permissions.database && (
            <button
              onClick={() => setActiveTab('database')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'database' ? 'bg-green-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Database className="w-4 h-4 mr-2 inline" />
              Banco
            </button>
          )}
          
          {permissions.scripts && (
            <button
              onClick={() => setActiveTab('scripts')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'scripts' ? 'bg-purple-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Scripts
            </button>
          )}

          {permissions.commands && (
            <button
              onClick={() => setActiveTab('commands')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'commands' ? 'bg-yellow-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Terminal className="w-4 h-4 mr-2 inline" />
              Comandos
            </button>
          )}
          
          {permissions.users && (
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'users' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2 inline" />
              Usuários
            </button>
          )}
          
          {permissions.logs && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'logs' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              Logs
            </button>
          )}

          {permissions.config && (
            <button
              onClick={() => setActiveTab('config')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'config' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Settings className="w-4 h-4 mr-2 inline" />
              Configurações
            </button>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-2 mb-2 text-sm text-slate-400">
            <User className="w-4 h-4" />
            <span>{user.name} ({user.role})</span>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 rounded-lg font-medium bg-red-600/80 hover:bg-red-700/80 text-white transition-colors backdrop-blur-sm"
          >
            <Power className="w-4 h-4 mr-2 inline" />
            Sair
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 bg-slate-900/60 backdrop-blur-sm relative z-10 min-h-screen overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
