
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  action: string;
  details: any;
  user: string;
}

const SystemLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const loadLogs = () => {
      const savedLogs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
      setLogs(savedLogs.reverse()); // Mais recentes primeiro
    };

    loadLogs();
    
    // Atualiza logs a cada 5 segundos
    const interval = setInterval(loadLogs, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('systemLogs');
    setLogs([]);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.user} - ${log.action}: ${JSON.stringify(log.details)}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
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
      default:
        return 'text-slate-300';
    }
  };

  return (
    <Card className="bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 shadow-xl shadow-cyan-500/10">
      <CardHeader>
        <CardTitle className="text-xl text-cyan-400 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
            Logs do Sistema
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportLogs}
              variant="outline"
              size="sm"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <FileText className="w-8 h-8 mr-2" />
              Nenhum log disponível
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
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
      </CardContent>
    </Card>
  );
};

export default SystemLogs;
