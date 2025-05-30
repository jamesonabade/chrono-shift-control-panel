
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DatabaseRestore = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);

    try {
      // Verificar se existe script de banco
      const checkResponse = await fetch('http://localhost:3001/api/check-script/database');
      const checkResult = await checkResponse.json();
      
      if (!checkResult.exists) {
        toast({
          title: "Script não encontrado",
          description: "O script de restauração de banco não foi carregado. Por favor, faça o upload do script na aba Scripts.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const envVar = selectedEnvironment === 'DEV' ? 'DB_DEV' : 'DB_TESTES';

      // Definir variáveis de ambiente
      const envVars = {
        [envVar]: 'true',
        ENVIRONMENT: selectedEnvironment,
        DATABASE_ENV: selectedEnvironment,
        RESTORE_TARGET: selectedEnvironment
      };

      const setEnvResponse = await fetch('http://localhost:3001/api/set-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envVars)
      });

      if (!setEnvResponse.ok) {
        throw new Error('Falha ao definir variáveis de ambiente');
      }

      // Executar script de restauração
      const executeResponse = await fetch('http://localhost:3001/api/execute-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptName: checkResult.script,
          environment: envVars,
          action: 'RESTAURAR_BANCO'
        })
      });

      const executeResult = await executeResponse.json();
      
      if (executeResult.success) {
        logAction('RESTORE_DATABASE_SUCCESS', {
          environment: selectedEnvironment,
          script: checkResult.script,
          variables: envVars
        });

        toast({
          title: "Restauração concluída!",
          description: `Banco ${selectedEnvironment} restaurado com sucesso`,
        });
      } else {
        logAction('RESTORE_DATABASE_ERROR', {
          environment: selectedEnvironment,
          script: checkResult.script,
          error: executeResult.error
        });

        toast({
          title: "Erro na restauração",
          description: executeResult.message || `Falha ao restaurar banco ${selectedEnvironment}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Erro ao restaurar banco:', error);
      logAction('RESTORE_DATABASE_FATAL_ERROR', {
        environment: selectedEnvironment,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      toast({
        title: "Erro",
        description: "Erro ao restaurar banco de dados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
        disabled={!selectedEnvironment || isLoading}
      >
        {isLoading ? 'RESTAURANDO...' : 'RESTAURAR BANCO'}
      </Button>

      {selectedEnvironment && (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-orange-500/30">
          <p className="text-sm text-slate-300">
            Variáveis de ambiente que serão definidas:
          </p>
          <ul className="mt-2 text-xs text-orange-400">
            <li>{selectedEnvironment === 'DEV' ? 'DB_DEV' : 'DB_TESTES'} = true</li>
            <li>ENVIRONMENT = {selectedEnvironment}</li>
            <li>DATABASE_ENV = {selectedEnvironment}</li>
            <li>RESTORE_TARGET = {selectedEnvironment}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DatabaseRestore;
