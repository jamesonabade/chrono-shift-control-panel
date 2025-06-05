
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Database, Play } from 'lucide-react';

const DatabaseRestore = () => {
  const [environment, setEnvironment] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  // Carregar último estado salvo
  useEffect(() => {
    const savedEnvironment = localStorage.getItem('lastSelectedEnvironment');
    if (savedEnvironment) setEnvironment(savedEnvironment);
  }, []);

  const executeCommand = async () => {
    if (!environment) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione o ambiente",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);

    try {
      // Carregar comandos vinculados ao botão banco
      const buttonCommands = JSON.parse(localStorage.getItem('buttonCommands') || '{}');
      const databaseCommands = buttonCommands.database || [];

      console.log('Comandos vinculados ao botão banco:', databaseCommands);

      if (databaseCommands.length === 0) {
        toast({
          title: "Nenhum comando configurado",
          description: "Configure comandos para o botão Banco na seção Comandos",
          variant: "destructive"
        });
        setIsExecuting(false);
        return;
      }

      // Carregar variáveis fixas do sistema (incluindo variáveis gerais)
      const systemVars = JSON.parse(localStorage.getItem('systemVariables') || '{}');
      console.log('Variáveis do sistema:', systemVars);
      
      const envVariables = {
        DB_RESTORE: environment,
        DB_SYSTEM: environment,
        ...(systemVars.database || {}),
        ...(systemVars.general || {}) // Incluir variáveis gerais
      };

      console.log('Variáveis de ambiente para execução:', envVariables);

      // Executar todos os comandos vinculados
      let allSuccess = true;
      for (const commandId of databaseCommands) {
        const allCommands = JSON.parse(localStorage.getItem('customCommands') || '[]');
        const command = allCommands.find((cmd: any) => cmd.id === commandId);
        
        if (command) {
          console.log('Executando comando:', command);
          
          const response = await fetch('http://localhost:3001/api/execute-command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              command: command.command,
              name: `Banco: ${command.name}`,
              description: `Restaurar banco de dados - Ambiente: ${environment} - ${command.description}`,
              environment: envVariables
            })
          });

          const result = await response.json();
          console.log('Resultado da execução:', result);
          
          if (!result.success) {
            allSuccess = false;
            toast({
              title: `Erro no comando: ${command.name}`,
              description: result.error || "Falha na execução",
              variant: "destructive"
            });
          }
        } else {
          console.warn('Comando não encontrado:', commandId);
        }
      }

      if (allSuccess) {
        // Salvar último estado aplicado
        localStorage.setItem('lastSelectedEnvironment', environment);
        
        toast({
          title: "Banco restaurado!",
          description: `Restauração concluída no ambiente ${environment}`,
        });

        // Log da ação
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'info',
          action: 'DATABASE_RESTORED',
          details: {
            environment: environment,
            commandsExecuted: databaseCommands.length,
            variables: envVariables
          },
          message: `Banco restaurado no ambiente: ${environment}`
        };
        
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
      }
    } catch (error) {
      console.error('Erro na execução:', error);
      toast({
        title: "Erro",
        description: `Erro ao executar comandos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-green-400">Restauração de Banco de Dados</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="environment" className="text-slate-300">Ambiente</Label>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50">
              <SelectValue placeholder="Selecione o ambiente" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-white">
              <SelectItem value="DEV" className="hover:bg-slate-700">DEV</SelectItem>
              <SelectItem value="TESTES" className="hover:bg-slate-700">TESTES</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={executeCommand}
        disabled={!environment || isExecuting}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3"
      >
        {isExecuting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Database className="w-5 h-5 mr-2" />
        )}
        {isExecuting ? 'Restaurando...' : 'Restaurar Banco'}
      </Button>

      {environment && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-300 text-sm">
            <strong>Ambiente:</strong> {environment}
          </p>
        </div>
      )}

      <div className="p-3 bg-slate-700/20 rounded text-xs text-slate-400">
        <p><strong>Variáveis disponíveis:</strong> $DB_RESTORE, $DB_SYSTEM + variáveis personalizadas</p>
      </div>
    </div>
  );
};

export default DatabaseRestore;
