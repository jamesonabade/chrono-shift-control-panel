
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DateTimeProps {
  className?: string;
  showIcon?: boolean;
}

const DateTime = ({ className = '', showIcon = true }: DateTimeProps) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [serverTime, setServerTime] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!serverTime) {
        setCurrentDateTime(new Date());
      }
    }, 1000);

    // Escutar eventos de mudança de data
    const handleDateChange = (event: CustomEvent) => {
      console.log('Data alterada, sincronizando com servidor:', event.detail);
      if (event.detail.serverTime) {
        setServerTime(event.detail.serverTime);
        setCurrentDateTime(new Date(event.detail.serverTime));
      }
    };

    window.addEventListener('dateChanged', handleDateChange as EventListener);

    // Sincronizar com servidor na inicialização
    syncWithServer();

    return () => {
      clearInterval(timer);
      window.removeEventListener('dateChanged', handleDateChange as EventListener);
    };
  }, [serverTime]);

  const syncWithServer = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/server-time');
      if (response.ok) {
        const { serverTime: time } = await response.json();
        setServerTime(time);
        setCurrentDateTime(new Date(time));
        console.log('Sincronizado com servidor:', time);
      }
    } catch (error) {
      console.warn('Não foi possível sincronizar com o servidor, usando horário local:', error);
      setServerTime(null);
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const { date, time } = formatDateTime(currentDateTime);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && <Clock className="w-4 h-4 text-cyan-400" />}
      <div className="text-sm">
        <span className="text-cyan-400">{date}</span>
        <span className="text-slate-400 mx-2">•</span>
        <span className="text-green-400">{time}</span>
        {serverTime && (
          <span className="text-xs text-yellow-400 ml-2">(Servidor)</span>
        )}
      </div>
    </div>
  );
};

export default DateTime;
