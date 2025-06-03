
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Database, Play, Settings } from 'lucide-react';

const DatabaseRestore = () => {
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [backupPath, setBackupPath] = useState('');
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

    if (!databaseUrl) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, informe a URL do banco de dados",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);

    try {
      const environment = {
        DATABASE_URL: databaseUrl,
        BACKUP_PATH: backupPath || '/app/backups/backup.sql',
        DB_HOST: databaseUrl.includes('@') ? databaseUrl.split('@')[1].split(':')[0] : '',
        DB_NAME: databaseUrl.includes('/') ? databaseUrl.split('/').pop() : ''
      };

      const response = await fetch('http://localhost:3001/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: databaseCommand,
          name: 'Restaurar Banco',
          description: `Restaurar banco de dados: ${databaseUrl}`,
          environment
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Banco restaurado!",
          description: "Restauração concluída com sucesso",
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
          <Label htmlFor="database-url" className="text-slate-300">URL do Banco de Dados</Label>
          <Input
            id="database-url"
            type="text"
            value={databaseUrl}
            onChange={(e) => setDatabaseUrl(e.target.value)}
            placeholder="postgresql://user:pass@host:port/database"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="backup-path" className="text-slate-300">Caminho do Backup (opcional)</Label>
          <Input
            id="backup-path"
            type="text"
            value={backupPath}
            onChange={(e) => setBackupPath(e.target.value)}
            placeholder="/app/backups/backup.sql"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
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
        disabled={!databaseUrl || isExecuting}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3"
      >
        {isExecuting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Database className="w-5 h-5 mr-2" />
        )}
        {isExecuting ? 'Restaurando...' : 'Restaurar Banco'}
      </Button>

      {databaseUrl && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-300 text-sm">
            <strong>Banco:</strong> {databaseUrl}
          </p>
          <p className="text-green-300 text-sm">
            <strong>Backup:</strong> {backupPath || '/app/backups/backup.sql'}
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
