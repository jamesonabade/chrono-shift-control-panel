
import { useState, useEffect } from 'react';
import { Calendar, Database, FileCode, FileText, Upload, Users, User, Power, Terminal, Settings } from 'lucide-react';
import DateSelector from '@/components/DateSelector';
import DatabaseRestore from '@/components/DatabaseRestore';
import ScriptUpload from '@/components/ScriptUpload';
import UserManagement from '@/components/UserManagement';
import SystemLogs from '@/components/SystemLogs';
import CommandManager from '@/components/CommandManager';
import SystemConfiguration from '@/components/SystemConfiguration';
import DateTime from '@/components/DateTime';

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('date');

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      onLogout();
    }

    // Aplicar personalizações globais
    applyGlobalCustomizations();
  }, [onLogout]);

  const applyGlobalCustomizations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/customizations');
      if (response.ok) {
        const customizations = await response.json();
        
        // Aplicar background
        if (customizations.background) {
          document.body.style.backgroundImage = `url(${customizations.background})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundAttachment = 'fixed';
        }

        // Aplicar título
        if (customizations.title) {
          document.title = customizations.title;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar personalizações:', error);
      // Fallback para localStorage
      const bgImage = localStorage.getItem('loginBackground');
      if (bgImage) {
        document.body.style.backgroundImage = `url(${bgImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
    }
  };

  const currentUser = localStorage.getItem('currentUser');
  const isAdmin = currentUser === 'administrador';
  
  const getUserPermissions = () => {
    if (isAdmin) {
      return {
        date: true,
        database: true,
        scripts: true,
        commands: true,
        users: true,
        logs: true,
        config: true
      };
    }
    
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    return userPermissions[currentUser || ''] || {};
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

  // Carregar logo personalizado
  const [customLogo, setCustomLogo] = useState('');

  useEffect(() => {
    const loadCustomLogo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/customizations');
        if (response.ok) {
          const customizations = await response.json();
          if (customizations.logo) {
            setCustomLogo(customizations.logo);
          }
        }
      } catch (error) {
        // Fallback para localStorage
        const logo = localStorage.getItem('loginLogo');
        if (logo) {
          setCustomLogo(logo);
        }
      }
    };

    loadCustomLogo();
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex flex-col space-y-2">
          {customLogo ? (
            <img src={customLogo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="text-xl font-semibold text-purple-400">
              Painel de Controle
            </div>
          )}
          <DateTime className="text-xs" />
        </div>
        <div className="p-4 space-y-2 flex-1">
          {permissions.date && (
            <button
              onClick={() => setActiveTab('date')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                activeTab === 'date'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
                activeTab === 'database'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
                activeTab === 'scripts'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
                activeTab === 'commands'
                  ? 'bg-yellow-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
                activeTab === 'users'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
                activeTab === 'logs'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
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
                activeTab === 'config'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Settings className="w-4 h-4 mr-2 inline" />
              Configurações
            </button>
          )}
        </div>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-2 mb-2 text-sm text-slate-400">
            <User className="w-4 h-4" />
            <span>{currentUser}</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Power className="w-4 h-4 mr-2 inline" />
            Sair
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
