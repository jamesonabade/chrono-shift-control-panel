
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

  const handleRestore = () => {
    if (!selectedEnvironment) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um ambiente",
        variant: "destructive"
      });
      return;
    }

    // Simula a definição da variável de ambiente
    const envVar = selectedEnvironment === 'DEV' ? 'DB_DEV' : 'DB_TESTES';
    localStorage.setItem(envVar, 'true');

    // Simula a execução do script Bash
    console.log(`Executando script de restauração para ambiente ${selectedEnvironment}`);

    toast({
      title: "Restauração iniciada!",
      description: `Banco ${selectedEnvironment} está sendo restaurado`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Ambiente</label>
        <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
            <SelectValue placeholder="Selecione o ambiente" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {environments.map((env) => (
              <SelectItem key={env.value} value={env.value} className="text-white hover:bg-slate-700">
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
