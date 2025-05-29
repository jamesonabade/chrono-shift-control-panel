
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DateSelector = () => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
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

    try {
      // Define as variáveis de ambiente no sistema
      const response = await fetch('http://localhost:3001/api/set-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          VARIAVEL_DIA: selectedDay,
          VARIAVEL_MES: selectedMonth
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao definir variáveis de ambiente');
      }

      const result = await response.json();

      logAction('SET_DATE_VARIABLES', {
        day: selectedDay,
        month: selectedMonth,
        monthName: months.find(m => m.value === selectedMonth)?.label,
        variables: { VARIAVEL_DIA: selectedDay, VARIAVEL_MES: selectedMonth },
        envFile: result.envFile
      });

      // Executa script de data se existir
      try {
        const scriptsResponse = await fetch('http://localhost:3001/api/scripts');
        if (scriptsResponse.ok) {
          const scripts = await scriptsResponse.json();
          const dateScript = scripts.find((s: any) => s.type === 'date');
          
          if (dateScript) {
            const executeResponse = await fetch('http://localhost:3001/api/execute-script', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                scriptName: dateScript.name,
                environment: {
                  VARIAVEL_DIA: selectedDay,
                  VARIAVEL_MES: selectedMonth
                }
              })
            });

            const executeResult = await executeResponse.json();
            
            if (executeResult.success) {
              logAction('EXECUTE_DATE_SCRIPT', {
                scriptName: dateScript.name,
                output: executeResult.output,
                logFile: executeResult.logFile,
                status: 'success'
              });
            } else {
              logAction('EXECUTE_DATE_SCRIPT', {
                scriptName: dateScript.name,
                error: executeResult.error,
                logFile: executeResult.logFile,
                status: 'failed'
              });
            }
          }
        }
      } catch (scriptError) {
        console.error('Erro ao executar script:', scriptError);
        logAction('EXECUTE_DATE_SCRIPT', {
          error: scriptError,
          status: 'script_not_found'
        });
      }

      toast({
        title: "Data aplicada!",
        description: `Data configurada: ${selectedDay}/${months.find(m => m.value === selectedMonth)?.label}`,
      });

    } catch (error) {
      console.error('Erro ao definir variáveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar configurações de data",
        variant: "destructive"
      });
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
        disabled={!selectedDay || !selectedMonth}
      >
        APLICAR DATA
      </Button>

      {selectedDay && selectedMonth && (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-500/30">
          <p className="text-sm text-slate-300">
            Variáveis que serão definidas:
          </p>
          <ul className="mt-2 text-xs text-cyan-400">
            <li>VARIAVEL_DIA = {selectedDay}</li>
            <li>VARIAVEL_MES = {selectedMonth}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
