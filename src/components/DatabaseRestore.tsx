
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Database, Play, Settings } from 'lucide-react';

const DatabaseRestore = () => {
  const [environment, setEnvironment] = useState('');
  const [databaseCommand, setDatabaseCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDatabaseCommand();
  }, []);

  const loadDatabaseCommand = () => {
    const saved = localStorage.getItem('databaseCommand');
    if (saved) {
      setDatabaseCommand(saved);
    } else {
      const defaultCommand = 'bash /app/scripts/restore_db.sh';
      setDatabaseCommand(defaultCommand);
      localStorage.setItem('databaseCommand', defaultCommand);
    }
  };

  const saveCommand = (command: string) => {
    setDatabaseCommand(command);
    localStorage.setItem('databaseCommand', command);
    toast({
      title: "Comando salvo!",
      description: "Comando de banco foi atualizado",
    });
  };

  const executeCommand = async () => {
    if (!databaseCommand.trim()) {
      toast({
        title: "Erro",
        description: "Comando não configurado",
        variant: "destructive"
      });
      return;
    }

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
      // Carregar variáveis fixas do sistema se existirem
      const systemVars = JSON.parse(localStorage.getItem('systemVariables') || '{}');
      
      const envVariables = {
        ENVIRONMENT: environment,
        ENV: environment,
        ...systemVars.database
      };

      const response = await fetch('http://localhost:3001/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: databaseCommand,
          name: 'Restaurar Banco',
          description: `Restaurar banco de dados - Ambiente: ${environment}`,
          environment: envVariables
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Banco restaurado!",
          description: `Restauração concluída no ambiente ${environment}`,
        });
      } else {
        toast({
          title: "Erro na execução",
          description: result.error || "Falha ao restaurar banco",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na execução:', error);
      toast({
        title: "Erro",
        description: `Erro ao executar comando: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Selecione o ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEV">DEV</SelectItem>
              <SelectItem value="TESTES">TESTES</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Comando de Execução</Label>
          <div className="flex gap-2">
            <Input
              value={databaseCommand}
              onChange={(e) => setDatabaseCommand(e.target.value)}
              placeholder="bash /app/scripts/restore_db.sh"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Button
              onClick={() => saveCommand(databaseCommand)}
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
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
          <p className="text-green-300 text-sm">
            <strong>Comando:</strong> {databaseCommand}
          </p>
        </div>
      )}
    </div>
  );
};

export default DatabaseRestore;
