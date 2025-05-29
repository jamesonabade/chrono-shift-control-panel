
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

  const handleApply = () => {
    if (!selectedDay || !selectedMonth) {
      toast({
        title: "Erro",
        description: "Por favor, selecione dia e mês",
        variant: "destructive"
      });
      return;
    }

    // Define as variáveis de ambiente
    const dayVar = `VARIAVEL_DIA=${selectedDay}`;
    const monthVar = `VARIAVEL_MES=${selectedMonth}`;
    
    // Simula a definição das variáveis
    localStorage.setItem('VARIAVEL_DIA', selectedDay);
    localStorage.setItem('VARIAVEL_MES', selectedMonth);

    console.log(`Definindo variáveis de ambiente: ${dayVar}, ${monthVar}`);
    
    logAction('SET_DATE_VARIABLES', {
      day: selectedDay,
      month: selectedMonth,
      monthName: months.find(m => m.value === selectedMonth)?.label,
      variables: { VARIAVEL_DIA: selectedDay, VARIAVEL_MES: selectedMonth }
    });

    // Simula a execução do script Bash
    console.log('Executando script de aplicação de data...');
    console.log(`#!/bin/bash`);
    console.log(`export VARIAVEL_DIA=${selectedDay}`);
    console.log(`export VARIAVEL_MES=${selectedMonth}`);
    console.log(`echo "Data configurada: ${selectedDay}/${selectedMonth}"`);

    logAction('EXECUTE_SCRIPT', {
      scriptType: 'date_script',
      command: `export VARIAVEL_DIA=${selectedDay} && export VARIAVEL_MES=${selectedMonth}`,
      status: 'success'
    });

    toast({
      title: "Data aplicada!",
      description: `Data configurada: ${selectedDay}/${months.find(m => m.value === selectedMonth)?.label}`,
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
                <SelectItem key={day} value={day.toString()} className="text-white hover:bg-slate-700">
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
