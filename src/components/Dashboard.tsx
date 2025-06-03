import { useState, useEffect } from 'react';
import { Calendar, Database, FileCode, FileText, Upload, Users, User, Power, Terminal } from 'lucide-react';
import DateSelector from '@/components/DateSelector';
import DatabaseRestore from '@/components/DatabaseRestore';
import ScriptUpload from '@/components/ScriptUpload';
import UserManagement from '@/components/UserManagement';
import SystemLogs from '@/components/SystemLogs';
import CommandManager from '@/components/CommandManager';

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('date');

  useEffect(() => {
    // Garante que o usuário seja redirecionado para a tela de login se não estiver autenticado
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true') {
      onLogout();
    }
  }, [onLogout]);

  const currentUser = localStorage.getItem('currentUser');
  const isAdmin = currentUser === 'administrador';
  
  // Verificar permissões do usuário atual
  const getUserPermissions = () => {
    if (isAdmin) {
      return {
        date: true,
        database: true,
        scripts: true,
        commands: true,
        users: true,
        logs: true
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
      default:
        return <DateSelector />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 text-xl font-semibold text-purple-400 border-b border-slate-700">
          Painel de Controle
        </div>
        <div className="p-4 space-y-2 flex-1">
          {permissions.date && (
            <button
              onClick={() => setActiveTab('date')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              Logs
            </button>
          )}
        </div>
        <div className="p-4 border-t border-slate-700">
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
