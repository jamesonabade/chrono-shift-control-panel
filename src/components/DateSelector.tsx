
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Play } from 'lucide-react';

const DateSelector = () => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  // Carregar último estado salvo
  useEffect(() => {
    const savedDay = localStorage.getItem('lastSelectedDay');
    const savedMonth = localStorage.getItem('lastSelectedMonth');
    const savedYear = localStorage.getItem('lastSelectedYear');
    if (savedDay) setSelectedDay(savedDay);
    if (savedMonth) setSelectedMonth(savedMonth);
    if (savedYear) setSelectedYear(savedYear);
  }, []);

  const executeCommand = async () => {
    if (!selectedDay || !selectedMonth || !selectedYear) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione o dia, mês e ano",
        variant: "destructive"
      });
      return;
    }

    const formattedDate = `${selectedDay.padStart(2, '0')}/${selectedMonth.padStart(2, '0')}/${selectedYear}`;

    setIsExecuting(true);

    try {
      // Carregar comandos vinculados ao botão data
      const buttonCommands = JSON.parse(localStorage.getItem('buttonCommands') || '{}');
      const dateCommands = buttonCommands.date || [];

      console.log('Comandos vinculados ao botão data:', dateCommands);

      if (dateCommands.length === 0) {
        toast({
          title: "Nenhum comando configurado",
          description: "Configure comandos para o botão Data na seção Comandos",
          variant: "destructive"
        });
        setIsExecuting(false);
        return;
      }

      // Carregar variáveis fixas do sistema (incluindo variáveis gerais)
      const systemVars = JSON.parse(localStorage.getItem('systemVariables') || '{}');
      console.log('Variáveis do sistema:', systemVars);
      
      const envVariables = {
        NEW_DATE: formattedDate,
        DATE: formattedDate,
        DAY: selectedDay.padStart(2, '0'),
        MONTH: selectedMonth.padStart(2, '0'),
        YEAR: selectedYear,
        ...(systemVars.date || {}),
        ...(systemVars.general || {}) // Incluir variáveis gerais
      };

      console.log('Variáveis de ambiente para execução:', envVariables);

      // Executar todos os comandos vinculados
      let allSuccess = true;
      for (const commandId of dateCommands) {
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
              name: `Data: ${command.name}`,
              description: `Alterar data para ${formattedDate} - ${command.description}`,
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
        localStorage.setItem('lastSelectedDay', selectedDay);
        localStorage.setItem('lastSelectedMonth', selectedMonth);
        localStorage.setItem('lastSelectedYear', selectedYear);
        
        toast({
          title: "Data aplicada!",
          description: `Sistema configurado para ${formattedDate}`,
        });

        // Sincronizar horário com servidor
        try {
          const response = await fetch('http://localhost:3001/api/server-time');
          if (response.ok) {
            const { serverTime } = await response.json();
            console.log('Horário do servidor após alteração:', serverTime);
            
            // Disparar evento para atualizar DateTime
            window.dispatchEvent(new CustomEvent('dateChanged', { 
              detail: { newDate: formattedDate, serverTime } 
            }));
          }
        } catch (error) {
          console.warn('Não foi possível sincronizar com o servidor:', error);
        }

        // Log da ação
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'info',
          action: 'DATE_APPLIED',
          details: {
            date: formattedDate,
            commandsExecuted: dateCommands.length,
            variables: envVariables
          },
          message: `Data aplicada: ${formattedDate}`
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

  // Gerar arrays para dias, meses e anos
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - 25 + i).toString());

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-400">Alteração de Data do Sistema</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="day" className="text-slate-300">Dia</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white max-h-60">
                {days.map(day => (
                  <SelectItem key={day} value={day} className="hover:bg-slate-700">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="month" className="text-slate-300">Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {months.map(month => (
                  <SelectItem key={month} value={month} className="hover:bg-slate-700">
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-slate-300">Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white max-h-60">
                {years.map(year => (
                  <SelectItem key={year} value={year} className="hover:bg-slate-700">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button 
        onClick={executeCommand}
        disabled={!selectedDay || !selectedMonth || !selectedYear || isExecuting}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
      >
        {isExecuting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Play className="w-5 h-5 mr-2" />
        )}
        {isExecuting ? 'Aplicando...' : 'Aplicar Data'}
      </Button>

      {selectedDay && selectedMonth && selectedYear && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Nova data:</strong> {selectedDay}/{selectedMonth}/{selectedYear}
          </p>
        </div>
      )}

      <div className="p-3 bg-slate-700/20 rounded text-xs text-slate-400">
        <p><strong>Variáveis disponíveis:</strong> $NEW_DATE, $DATE, $DAY, $MONTH, $YEAR + variáveis personalizadas</p>
      </div>
    </div>
  );
};

export default DateSelector;
