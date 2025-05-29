
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DatabaseRestore = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const { toast } = useToast();

  const environments = [
    { value: 'DEV', label: 'Desenvolvimento (DEV)' },
    { value: 'TESTES', label: 'Testes (TESTES)' }
  ];

  const logAction = (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: localStorage.getItem('currentUser') || 'admin'
    };
    
    console.log('DATABASE_RESTORE_LOG:', JSON.stringify(logEntry));
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
  };

  const handleRestore = async () => {
    if (!selectedEnvironment) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um ambiente",
        variant: "destructive"
      });
      return;
    }

    const envVar = selectedEnvironment === 'DEV' ? 'DB_DEV' : 'DB_TESTES';

    try {
      // Define a variável de ambiente no sistema
      const response = await fetch('http://localhost:3001/api/set-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [envVar]: 'true',
          ENVIRONMENT: selectedEnvironment
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao definir variáveis de ambiente');
      }

      const result = await response.json();

      logAction('RESTORE_DATABASE', {
        environment: selectedEnvironment,
        variable: envVar,
        value: 'true',
        envFile: result.envFile
      });

      // Executa o script de restauração
      try {
        const scriptsResponse = await fetch('http://localhost:3001/api/scripts');
        if (scriptsResponse.ok) {
          const scripts = await scriptsResponse.json();
          const dbScript = scripts.find((s: any) => 
            s.type === 'database' && 
            (s.name.includes(selectedEnvironment.toLowerCase()) || s.name.includes('restore'))
          );
          
          if (dbScript) {
            const executeResponse = await fetch('http://localhost:3001/api/execute-script', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                scriptName: dbScript.name,
                environment: {
                  [envVar]: 'true',
                  ENVIRONMENT: selectedEnvironment
                }
              })
            });

            const executeResult = await executeResponse.json();
            
            if (executeResult.success) {
              logAction('EXECUTE_RESTORE_SCRIPT', {
                scriptName: dbScript.name,
                environment: selectedEnvironment,
                output: executeResult.output,
                logFile: executeResult.logFile,
                status: 'success'
              });

              toast({
                title: "Restauração concluída!",
                description: `Banco ${selectedEnvironment} restaurado com sucesso`,
              });
            } else {
              logAction('EXECUTE_RESTORE_SCRIPT', {
                scriptName: dbScript.name,
                environment: selectedEnvironment,
                error: executeResult.error,
                logFile: executeResult.logFile,
                status: 'failed'
              });

              toast({
                title: "Erro na restauração",
                description: `Falha ao restaurar banco ${selectedEnvironment}`,
                variant: "destructive"
              });
            }
          } else {
            toast({
              title: "Script não encontrado",
              description: `Nenhum script de restauração encontrado para ${selectedEnvironment}`,
              variant: "destructive"
            });
          }
        }
      } catch (scriptError) {
        console.error('Erro ao executar script:', scriptError);
        logAction('EXECUTE_RESTORE_SCRIPT', {
          scriptType: 'database_restore',
          environment: selectedEnvironment,
          error: scriptError,
          status: 'failed'
        });
      }

    } catch (error) {
      console.error('Erro ao definir variável:', error);
      toast({
        title: "Erro",
        description: "Erro ao restaurar banco de dados",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Ambiente</label>
        <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
            <SelectValue placeholder="Selecione o ambiente" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 z-[100] backdrop-blur-xl shadow-2xl">
            {environments.map((env) => (
              <SelectItem key={env.value} value={env.value} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                {env.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleRestore}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/30"
        disabled={!selectedEnvironment}
      >
        RESTAURAR BANCO
      </Button>

      {selectedEnvironment && (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-orange-500/30">
          <p className="text-sm text-slate-300">
            Variável de ambiente que será definida:
          </p>
          <ul className="mt-2 text-xs text-orange-400">
            <li>{selectedEnvironment === 'DEV' ? 'DB_DEV' : 'DB_TESTES'} = true</li>
            <li>ENVIRONMENT = {selectedEnvironment}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DatabaseRestore;
