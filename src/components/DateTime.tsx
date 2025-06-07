
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DateTimeProps {
  className?: string;
  showIcon?: boolean;
}

const DateTime = ({ className = '', showIcon = true }: DateTimeProps) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      </div>
    </div>
  );
};

export default DateTime;
