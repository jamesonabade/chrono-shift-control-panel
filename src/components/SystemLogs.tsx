import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Trash2, Server, Monitor } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  action: string;
  details: any;
  user: string;
}

interface BackendLog {
  timestamp: string;
  level: string;
  action: string;
  details: any;
  message: string;
}

const SystemLogs = () => {
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [backendLogs, setBackendLogs] = useState<BackendLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSystemLogs = () => {
      const savedLogs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
      setSystemLogs(savedLogs.reverse()); // Mais recentes primeiro
    };

    const loadBackendLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/backend-logs');
        if (response.ok) {
          const logs = await response.json();
          console.log('Backend logs carregados:', logs);
          setBackendLogs(Array.isArray(logs) ? logs : []);
        } else {
          console.error('Erro ao carregar logs do backend:', response.statusText);
          setBackendLogs([]);
        }
      } catch (error) {
        console.error('Erro ao carregar logs do backend:', error);
        setBackendLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadSystemLogs();
    loadBackendLogs();
    
    // Atualiza logs a cada 10 segundos
    const interval = setInterval(() => {
      loadSystemLogs();
      loadBackendLogs();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const clearSystemLogs = () => {
    localStorage.removeItem('systemLogs');
    setSystemLogs([]);
  };

  const clearBackendLogs = () => {
    setBackendLogs([]);
  };

  const exportLogs = (type: 'system' | 'backend') => {
    let logsText = '';
    let fileName = '';

    if (type === 'system') {
      logsText = systemLogs.map(log => 
        `[${log.timestamp}] ${log.user} - ${log.action}: ${JSON.stringify(log.details)}`
      ).join('\n');
      fileName = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    } else {
      logsText = backendLogs.map(log => 
        `[${log.timestamp}] ${log.level} - ${log.message}${log.details ? ': ' + JSON.stringify(log.details) : ''}`
      ).join('\n');
      fileName = `backend-logs-${new Date().toISOString().split('T')[0]}.txt`;
    }
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SET_DATE_VARIABLES':
        return 'text-blue-400';
      case 'RESTORE_DATABASE':
        return 'text-orange-400';
      case 'EXECUTE_SCRIPT':
        return 'text-green-400';
      case 'CREATE_USER':
        return 'text-cyan-400';
      case 'DELETE_USER':
        return 'text-red-400';
      case 'CHANGE_PASSWORD':
        return 'text-yellow-400';
      case 'LOGIN_SUCCESS':
        return 'text-green-400';
      case 'LOGIN_FAILED':
        return 'text-red-400';
      case 'LOGOUT':
        return 'text-orange-400';
      default:
        return 'text-slate-300';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400';
      case 'WARN':
        return 'text-yellow-400';
      case 'INFO':
        return 'text-blue-400';
      case 'DEBUG':
        return 'text-cyan-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <Card className="bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 shadow-xl shadow-cyan-500/10">
      <CardHeader>
        <CardTitle className="text-xl text-cyan-400 flex items-center">
          <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
          Logs do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="system" className="data-[state=active]:bg-cyan-500/20">
              <Monitor className="w-4 h-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="backend" className="data-[state=active]:bg-cyan-500/20">
              <Server className="w-4 h-4 mr-2" />
              Backend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-4">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                onClick={() => exportLogs('system')}
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                onClick={clearSystemLogs}
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>

            <ScrollArea className="h-96 w-full">
              {systemLogs.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <FileText className="w-8 h-8 mr-2" />
                  Nenhum log do sistema disponível
                </div>
              ) : (
                <div className="space-y-2">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300">
                        Usuário: <span className="text-cyan-400">{log.user}</span>
                      </div>
                      {log.details && (
                        <div className="text-xs text-slate-400 mt-1 font-mono bg-slate-800/50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="backend" className="mt-4">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                onClick={() => exportLogs('backend')}
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                onClick={clearBackendLogs}
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>

            <ScrollArea className="h-96 w-full">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <span className="ml-2">Carregando logs...</span>
                </div>
              ) : backendLogs.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <Server className="w-8 h-8 mr-2" />
                  Nenhum log do backend disponível
                </div>
              ) : (
                <div className="space-y-2">
                  {backendLogs.map((log, index) => (
                    <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                          [{log.level}] {log.action}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 mb-1">
                        {log.message}
                      </div>
                      {log.details && (
                        <div className="text-xs text-slate-400 mt-1 font-mono bg-slate-800/50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemLogs;
