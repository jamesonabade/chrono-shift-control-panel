
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Play } from 'lucide-react';

const DateSelector = () => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const executeCommand = async () => {
    if (!selectedDay || !selectedMonth) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione o dia e mês",
        variant: "destructive"
      });
      return;
    }

    // Validar dia e mês
    const day = parseInt(selectedDay);
    const month = parseInt(selectedMonth);
    
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      toast({
        title: "Data inválida",
        description: "Por favor, insira um dia (1-31) e mês (1-12) válidos",
        variant: "destructive"
      });
      return;
    }

    const formattedDate = `${selectedDay.padStart(2, '0')}/${selectedMonth.padStart(2, '0')}`;

    setIsExecuting(true);

    try {
      // Carregar variáveis fixas do sistema se existirem
      const systemVars = JSON.parse(localStorage.getItem('systemVariables') || '{}');
      
      const environment = {
        NEW_DATE: formattedDate,
        DATE: formattedDate,
        DAY: selectedDay.padStart(2, '0'),
        MONTH: selectedMonth.padStart(2, '0'),
        ...systemVars.date
      };

      const response = await fetch('http://localhost:3001/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'bash /app/scripts/change_date.sh',
          name: 'Aplicar Data',
          description: `Alterar data para ${formattedDate}`,
          environment
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Data aplicada!",
          description: `Sistema configurado para ${formattedDate}`,
        });
      } else {
        toast({
          title: "Erro na execução",
          description: result.error || "Falha ao aplicar data",
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
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-400">Alteração de Data do Sistema</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="day" className="text-slate-300">Dia</Label>
            <Input
              id="day"
              type="number"
              min="1"
              max="31"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              placeholder="DD"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="month" className="text-slate-300">Mês</Label>
            <Input
              id="month"
              type="number"
              min="1"
              max="12"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              placeholder="MM"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={executeCommand}
        disabled={!selectedDay || !selectedMonth || isExecuting}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
      >
        {isExecuting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Play className="w-5 h-5 mr-2" />
        )}
        {isExecuting ? 'Aplicando...' : 'Aplicar Data'}
      </Button>

      {selectedDay && selectedMonth && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Nova data:</strong> {selectedDay.padStart(2, '0')}/{selectedMonth.padStart(2, '0')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
