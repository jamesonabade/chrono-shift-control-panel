
import { useState, useEffect } from 'react';

interface ServerStatusProps {
  onStatusChange: (isOnline: boolean, status: 'checking' | 'online' | 'offline') => void;
}

export const ServerStatus = ({ onStatusChange }: ServerStatusProps) => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const getServerUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    const basePath = import.meta.env.VITE_BASE_PATH || '';
    return `${protocol}//${hostname}${basePath !== '/' ? basePath : ''}`;
  };

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const serverUrl = getServerUrl();
      console.log('Verificando servidor:', `${serverUrl}/api/health`);
      
      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('Servidor online');
        setServerStatus('online');
        onStatusChange(true, 'online');
      } else {
        console.log('Servidor respondeu com erro:', response.status);
        setServerStatus('offline');
        onStatusChange(false, 'offline');
      }
    } catch (error) {
      try {
        const response = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('Servidor online (localhost)');
          setServerStatus('online');
          onStatusChange(true, 'online');
          return;
        }
      } catch (localError) {
        console.error('Erro ao verificar servidor local:', localError);
      }
      
      console.error('Erro ao verificar status do servidor:', error);
      setServerStatus('offline');
      onStatusChange(false, 'offline');
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      serverStatus === 'online' ? 'bg-green-500/20 text-green-400' :
      serverStatus === 'offline' ? 'bg-red-500/20 text-red-400' :
      'bg-yellow-500/20 text-yellow-400'
    }`}>
      {serverStatus === 'online' ? 'Servidor Online' :
       serverStatus === 'offline' ? 'Servidor Indisponível' :
       'Verificando...'}
    </div>
  );
};
