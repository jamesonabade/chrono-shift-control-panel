
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Play, Settings } from 'lucide-react';

const DateSelector = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [dateCommand, setDateCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDateCommand();
  }, []);

  const loadDateCommand = () => {
    const saved = localStorage.getItem('dateCommand');
    if (saved) {
      setDateCommand(saved);
    } else {
      const defaultCommand = 'bash /app/scripts/change_date.sh';
      setDateCommand(defaultCommand);
      localStorage.setItem('dateCommand', defaultCommand);
    }
  };

  const saveCommand = (command: string) => {
    setDateCommand(command);
    localStorage.setItem('dateCommand', command);
    toast({
      title: "Comando salvo!",
      description: "Comando de data foi atualizado",
    });
  };

  const executeCommand = async () => {
    if (!dateCommand.trim()) {
      toast({
        title: "Erro",
        description: "Comando não configurado",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione data e hora",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);

    try {
      const environment = {
        NEW_DATE: selectedDate,
        NEW_TIME: selectedTime,
        DATETIME: `${selectedDate} ${selectedTime}`
      };

      const response = await fetch('http://localhost:3001/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: dateCommand,
          name: 'Aplicar Data',
          description: `Alterar data para ${selectedDate} ${selectedTime}`,
          environment
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Data aplicada!",
          description: `Sistema configurado para ${selectedDate} ${selectedTime}`,
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-slate-300">Data</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time" className="text-slate-300">Hora</Label>
          <Input
            id="time"
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Comando de Execução</Label>
        <div className="flex gap-2">
          <Input
            value={dateCommand}
            onChange={(e) => setDateCommand(e.target.value)}
            placeholder="bash /app/scripts/change_date.sh"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Button
            onClick={() => saveCommand(dateCommand)}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button 
        onClick={executeCommand}
        disabled={!selectedDate || !selectedTime || isExecuting}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
      >
        {isExecuting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <Play className="w-5 h-5 mr-2" />
        )}
        {isExecuting ? 'Aplicando...' : 'Aplicar Data'}
      </Button>

      {selectedDate && selectedTime && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Nova data/hora:</strong> {selectedDate} {selectedTime}
          </p>
          <p className="text-blue-300 text-sm">
            <strong>Comando:</strong> {dateCommand}
          </p>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
