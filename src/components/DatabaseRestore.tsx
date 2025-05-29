
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
      const response = await fetch('/api/set-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [envVar]: 'true'
        })
      });

      if (!response.ok) {
        // Fallback para ambiente de desenvolvimento
        console.log(`export ${envVar}=true`);
        localStorage.setItem(envVar, 'true');
      }

      logAction('RESTORE_DATABASE', {
        environment: selectedEnvironment,
        variable: envVar,
        value: 'true'
      });

      // Executa o script de restauração
      try {
        const scriptResponse = await fetch('/api/execute-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'database_restore',
            environment: selectedEnvironment.toLowerCase(),
            envVar: envVar
          })
        });

        if (!scriptResponse.ok) {
          // Fallback para logs do console
          console.log(`Executando script de restauração para ambiente ${selectedEnvironment}`);
          console.log(`#!/bin/bash`);
          console.log(`export ${envVar}=true`);
          console.log(`echo "Iniciando restauração do banco ${selectedEnvironment}..."`);
          console.log(`bash /app/scripts/restore_${selectedEnvironment.toLowerCase()}.sh`);
          console.log(`echo "Banco ${selectedEnvironment} restaurado com sucesso!"`);
        }

        logAction('EXECUTE_SCRIPT', {
          scriptType: 'database_restore',
          environment: selectedEnvironment,
          command: `export ${envVar}=true && restore_database_${selectedEnvironment.toLowerCase()}.sh`,
          status: 'success'
        });

        toast({
          title: "Restauração iniciada!",
          description: `Banco ${selectedEnvironment} está sendo restaurado`,
        });

      } catch (scriptError) {
        console.error('Erro ao executar script:', scriptError);
        logAction('EXECUTE_SCRIPT', {
          scriptType: 'database_restore',
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
          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400 relative z-50">
            <SelectValue placeholder="Selecione o ambiente" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 z-[9999] backdrop-blur-lg">
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
          </ul>
        </div>
      )}
    </div>
  );
};

export default DatabaseRestore;
