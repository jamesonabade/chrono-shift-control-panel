
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Eye, AlertCircle, CheckCircle, XCircle, Terminal, Server, MonitorSpeaker } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: string;
  action: string;
  details: any;
  message: string;
}

const SystemLogs = () => {
  const [backendLogs, setBackendLogs] = useState<LogEntry[]>([]);
  const [frontendLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('backend');
  const { toast } = useToast();

  useEffect(() => {
    loadBackendLogs();
    const interval = setInterval(loadBackendLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBackendLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/backend-logs');
      if (response.ok) {
        const data = await response.json();
        setBackendLogs(data);
      } else {
        throw new Error('Falha ao carregar logs');
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar logs do backend (http://localhost:3001/api/backend-logs)`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadLogs = (logs: LogEntry[], type: string) => {
    const logContent = logs.map(log => 
      `${log.timestamp} - [${log.level}] ${log.action}: ${JSON.stringify(log.details, null, 2)}`
    ).join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download concluído!",
      description: `Logs ${type} salvos com sucesso`,
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <Terminal className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'info': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'warn': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const hasExecutionOutput = (details: any) => {
    return details && (details.stdout || details.stderr || details.output);
  };

  const renderExecutionOutput = (details: any) => {
    if (!hasExecutionOutput(details)) return null;

    return (
      <div className="mt-4 space-y-3">
        {details.stdout && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-green-400 font-semibold">STDOUT (Saída)</span>
            </div>
            <pre className="text-sm text-green-300 whitespace-pre-wrap font-mono bg-green-900/20 p-2 rounded">
              {details.stdout}
            </pre>
          </div>
        )}
        
        {details.stderr && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <XCircle className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-red-400 font-semibold">STDERR (Erro)</span>
            </div>
            <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono bg-red-900/20 p-2 rounded">
              {details.stderr}
            </pre>
          </div>
        )}

        {details.output && !details.stdout && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Terminal className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-blue-400 font-semibold">OUTPUT</span>
            </div>
            <pre className="text-sm text-blue-300 whitespace-pre-wrap font-mono bg-blue-900/20 p-2 rounded">
              {details.output}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const showLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const renderLogList = (logs: LogEntry[], type: string) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {type === 'backend' ? 
            <Server className="w-5 h-5 text-cyan-400" /> : 
            <MonitorSpeaker className="w-5 h-5 text-purple-400" />
          }
          <h3 className="text-lg font-semibold text-cyan-400">
            Logs do {type === 'backend' ? 'Backend' : 'Frontend'}
          </h3>
        </div>
        <div className="flex space-x-2">
          {type === 'backend' && (
            <Button
              onClick={loadBackendLogs}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Atualizar'
              )}
            </Button>
          )}
          <Button
            onClick={() => downloadLogs(logs, type)}
            disabled={logs.length === 0}
            variant="outline"
            size="sm"
            className="border-green-500/50 text-green-400 hover:bg-green-500/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-6 bg-slate-700/30 rounded-lg border border-slate-600/30 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getLevelColor(log.level)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {getLevelIcon(log.level)}
                    <span className="font-semibold">{log.action}</span>
                    <span className="text-xs opacity-75">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2 opacity-90">
                    {typeof log.details === 'string' ? log.details : 
                     log.details?.scriptName ? `Script: ${log.details.scriptName}` :
                     log.details?.command ? `Comando: ${log.details.command}` :
                     log.details?.fileName ? `Arquivo: ${log.details.fileName}` :
                     'Operação do sistema'}
                  </p>

                  {hasExecutionOutput(log.details) && (
                    <div className="mt-2 space-y-1">
                      {log.details.stdout && (
                        <div className="text-xs">
                          <span className="text-green-400 font-semibold">✓ STDOUT:</span>
                          <span className="ml-2 opacity-75">
                            {log.details.stdout.slice(0, 100)}{log.details.stdout.length > 100 ? '...' : ''}
                          </span>
                        </div>
                      )}
                      {log.details.stderr && (
                        <div className="text-xs">
                          <span className="text-red-400 font-semibold">✗ STDERR:</span>
                          <span className="ml-2 opacity-75">
                            {log.details.stderr.slice(0, 100)}{log.details.stderr.length > 100 ? '...' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => showLogDetails(log)}
                  variant="outline"
                  size="sm"
                  className="border-current/30 hover:bg-current/10 flex-shrink-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backend" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Backend
          </TabsTrigger>
          <TabsTrigger value="frontend" className="flex items-center gap-2">
            <MonitorSpeaker className="w-4 h-4" />
            Frontend
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="backend">
          {renderLogList(backendLogs, 'backend')}
        </TabsContent>
        
        <TabsContent value="frontend">
          {renderLogList(frontendLogs, 'frontend')}
        </TabsContent>
      </Tabs>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Detalhes do Log: {selectedLog?.action}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Timestamp:</span>
                  <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-slate-400">Nível:</span>
                  <p className={`text-white flex items-center space-x-2`}>
                    {getLevelIcon(selectedLog.level)}
                    <span>{selectedLog.level}</span>
                  </p>
                </div>
              </div>

              {renderExecutionOutput(selectedLog.details)}

              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="text-slate-300 mb-2">Detalhes Completos:</h4>
                <ScrollArea className="h-60 w-full">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemLogs;
