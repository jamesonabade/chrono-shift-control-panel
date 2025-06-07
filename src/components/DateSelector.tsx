
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DateSelector = () => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const logAction = (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: localStorage.getItem('currentUser') || 'admin'
    };
    
    console.log('DATE_SELECTOR_LOG:', JSON.stringify(logEntry));
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
  };

  const handleApply = async () => {
    if (!selectedDay || !selectedMonth) {
      toast({
        title: "Erro",
        description: "Por favor, selecione dia e mês",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se existe script de data
      const checkResponse = await fetch('http://localhost:3001/api/check-script/date');
      const checkResult = await checkResponse.json();
      
      if (!checkResult.exists) {
        toast({
          title: "Script não encontrado",
          description: "O script de alteração de data não foi carregado. Por favor, faça o upload do script na aba Scripts.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Definir variáveis de ambiente
      const envVars = {
        VARIAVEL_DIA: selectedDay,
        VARIAVEL_MES: selectedMonth,
        DIA_SELECIONADO: selectedDay,
        MES_SELECIONADO: selectedMonth
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

      // Executar script de data
      const executeResponse = await fetch('http://localhost:3001/api/execute-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptName: checkResult.script,
          environment: envVars,
          action: 'APLICAR_DATA'
        })
      });

      const executeResult = await executeResponse.json();
      
      if (executeResult.success) {
        logAction('APPLY_DATE_SUCCESS', {
          day: selectedDay,
          month: selectedMonth,
          monthName: months.find(m => m.value === selectedMonth)?.label,
          script: checkResult.script,
          variables: envVars
        });

        toast({
          title: "Data aplicada com sucesso!",
          description: `Data configurada: ${selectedDay}/${months.find(m => m.value === selectedMonth)?.label}`,
        });
      } else {
        logAction('APPLY_DATE_ERROR', {
          day: selectedDay,
          month: selectedMonth,
          script: checkResult.script,
          error: executeResult.error
        });

        toast({
          title: "Erro na execução",
          description: executeResult.message || "Erro ao executar script de data",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Erro ao aplicar data:', error);
      logAction('APPLY_DATE_FATAL_ERROR', {
        day: selectedDay,
        month: selectedMonth,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      toast({
        title: "Erro",
        description: "Erro ao aplicar configurações de data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Dia</label>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 z-[100] backdrop-blur-xl shadow-2xl">
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Mês</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 z-[100] backdrop-blur-xl shadow-2xl">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleApply}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30"
        disabled={!selectedDay || !selectedMonth || isLoading}
      >
        {isLoading ? 'APLICANDO...' : 'APLICAR DATA'}
      </Button>

      {selectedDay && selectedMonth && (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-500/30">
          <p className="text-sm text-slate-300">
            Variáveis que serão definidas:
          </p>
          <ul className="mt-2 text-xs text-cyan-400">
            <li>VARIAVEL_DIA = {selectedDay}</li>
            <li>VARIAVEL_MES = {selectedMonth}</li>
            <li>DIA_SELECIONADO = {selectedDay}</li>
            <li>MES_SELECIONADO = {selectedMonth}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
