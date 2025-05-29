
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DateSelector = () => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const { toast } = useToast();

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const handleApply = () => {
    if (!selectedDay || !selectedMonth) {
      toast({
        title: "Erro",
        description: "Por favor, selecione dia e mês",
        variant: "destructive"
      });
      return;
    }

    // Simula a definição das variáveis de ambiente
    localStorage.setItem('VARIAVEL_DIA', selectedDay);
    localStorage.setItem('VARIAVEL_MES', selectedMonth);

    // Simula a execução do script Bash
    console.log(`Executando script com VARIAVEL_DIA=${selectedDay} e VARIAVEL_MES=${selectedMonth}`);

    toast({
      title: "Data aplicada com sucesso!",
      description: `Dia: ${selectedDay}, Mês: ${months.find(m => m.value === selectedMonth)?.label}`,
    });
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
            <SelectContent className="bg-slate-800 border-slate-600">
              {days.map((day) => (
                <SelectItem key={day} value={day} className="text-white hover:bg-slate-700">
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
            <SelectContent className="bg-slate-800 border-slate-600">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value} className="text-white hover:bg-slate-700">
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
            Variáveis de ambiente que serão definidas:
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
