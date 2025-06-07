
import { useState, useEffect } from 'react';
import { serverApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DateTimeProps {
  className?: string;
}

export default function DateTime({ className }: DateTimeProps) {
  const [dateTime, setDateTime] = useState(new Date());
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Atualizar horário local a cada segundo
    const localTimer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Sincronizar com servidor apenas a cada 5 minutos
    const syncWithServer = async () => {
      try {
        const response = await serverApi.getServerTime();
        if (response.data.success) {
          setServerTime(response.data.data.serverTime);
          setLastSync(new Date());
          console.log('🕐 Sincronizado com servidor:', response.data.data.serverTime);
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar com servidor:', error);
      }
    };

    // Sincronizar imediatamente
    syncWithServer();

    // Sincronizar a cada 5 minutos (300000ms)
    const serverTimer = setInterval(syncWithServer, 300000);

    return () => {
      clearInterval(localTimer);
      clearInterval(serverTimer);
    };
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Bahia'
    });
  };

  return (
    <div className={cn("flex flex-col items-end text-sm text-gray-600 dark:text-gray-400", className)}>
      <div className="font-mono">
        {formatDateTime(dateTime)}
      </div>
      {lastSync && (
        <div className="text-xs text-gray-500">
          Último sync: {lastSync.toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  );
}
