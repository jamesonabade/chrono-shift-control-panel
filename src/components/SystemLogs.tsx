
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Eye, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemLog {
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
  const [frontendLogs, setFrontendLogs] = useState<SystemLog[]>([]);
  const [backendLogs, setBackendLogs] = useState<BackendLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFrontendLogs();
    loadBackendLogs();
  }, []);

  const loadFrontendLogs = () => {
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    setFrontendLogs(logs.reverse());
  };

  const loadBackendLogs = async () => {
    setIsLoading(true);
    try {
      // Usar a URL correta do backend
      const response = await fetch('http://localhost:3001/api/backend-logs');
      if (response.ok) {
        const logs = await response.json();
        setBackendLogs(logs);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao carregar logs do backend:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs do backend. Verifique se o backend está rodando.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLogMessage = (log: BackendLog) => {
    if (typeof log.details === 'object' && log.details !== null) {
      if (log.details.stdout) {
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium text-cyan-400">Ação:</span> {log.action}
            </div>
            {log.details.scriptName && (
              <div>
                <span className="font-medium text-cyan-400">Script:</span> {log.details.scriptName}
              </div>
            )}
            {log.details.stdout && (
              <div>
                <span className="font-medium text-green-400">STDOUT:</span>
                <pre className="mt-1 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-300 whitespace-pre-wrap overflow-x-auto">
                  {log.details.stdout}
                </pre>
              </div>
            )}
            {log.details.stderr && (
              <div>
                <span className="font-medium text-red-400">STDERR:</span>
                <pre className="mt-1 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 whitespace-pre-wrap overflow-x-auto">
                  {log.details.stderr}
                </pre>
              </div>
            )}
            {log.details.error && (
              <div>
                <span className="font-medium text-orange-400">Erro:</span> {log.details.error}
              </div>
            )}
          </div>
        );
      }
      return JSON.stringify(log.details, null, 2);
    }
    return log.message || String(log.details);
  };

  const truncateMessage = (message: string, maxLength: number = 200) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const exportLogs = (type: 'frontend' | 'backend') => {
    const logs = type === 'frontend' ? frontendLogs : backendLogs;
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'warn': case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'debug': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-500/30';
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
          <Button
            onClick={() => { loadFrontendLogs(); loadBackendLogs(); }}
            variant="outline"
            size="sm"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="frontend" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="frontend" className="data-[state=active]:bg-cyan-500/20">
              Frontend ({frontendLogs.length})
            </TabsTrigger>
            <TabsTrigger value="backend" className="data-[state=active]:bg-cyan-500/20">
              Backend ({backendLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frontend" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Logs do Frontend</h3>
              <Button
                onClick={() => exportLogs('frontend')}
                variant="outline"
                size="sm"
                className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {frontendLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Nenhum log encontrado</p>
              ) : (
                frontendLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/50">
                          {log.action}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-cyan-400">
                          Usuário: {log.user}
                        </span>
                      </div>
                    </div>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="backend" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Logs do Backend</h3>
              <Button
                onClick={() => exportLogs('backend')}
                variant="outline"
                size="sm"
                className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-slate-400 text-center py-4">Carregando logs...</p>
              ) : backendLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Nenhum log encontrado</p>
              ) : (
                backendLogs.map((log, index) => {
                  const logId = `${log.timestamp}-${index}`;
                  const isExpanded = expandedLog === logId;
                  const formattedMessage = formatLogMessage(log);
                  const isComplexLog = typeof formattedMessage === 'object';
                  
                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getLevelColor(log.level)}`}
                          >
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/50">
                            {log.action}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {isComplexLog && (
                          <Button
                            onClick={() => setExpandedLog(isExpanded ? null : logId)}
                            variant="outline"
                            size="sm"
                            className="border-slate-500/50 text-slate-400 hover:bg-slate-600/20"
                          >
                            {isExpanded ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-300">
                        {isComplexLog ? (
                          isExpanded ? (
                            <div className="space-y-2">{formattedMessage}</div>
                          ) : (
                            <div className="space-y-1">
                              <div>{log.action}</div>
                              <div className="text-xs text-slate-500">
                                Clique no botão para ver detalhes completos
                              </div>
                            </div>
                          )
                        ) : (
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {typeof formattedMessage === 'string' ? 
                              (formattedMessage.length > 200 && !isExpanded ? 
                                truncateMessage(formattedMessage) : formattedMessage
                              ) : formattedMessage
                            }
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemLogs;
