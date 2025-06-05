
import { useState, useEffect } from 'react';

interface ServerStatusProps {
  onStatusChange: (isOnline: boolean, status: 'checking' | 'online' | 'offline') => void;
}

export const ServerStatus = ({ onStatusChange }: ServerStatusProps) => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const getServerUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Em desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (window.location.port === '8080') {
        return 'http://localhost:3001';
      }
    }
    
    // Em Docker ou produção
    const basePath = import.meta.env.VITE_BASE_PATH || '';
    if (basePath && basePath !== '/') {
      return `${protocol}//${hostname}${basePath}/api`;
    }
    
    return `${protocol}//${hostname}/api`;
  };

  const checkServerStatus = async () => {
    console.log('Verificando status do servidor...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const serverUrl = getServerUrl();
      console.log('URL de verificação:', `${serverUrl}/health`);
      
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Servidor online, resposta:', data);
        setServerStatus('online');
        onStatusChange(true, 'online');
        return;
      } else {
        console.log('Servidor respondeu com erro:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('Erro na verificação principal:', error);
    }

    // Fallback para localhost:3001 se estivermos em desenvolvimento
    try {
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Servidor online (localhost fallback):', data);
        setServerStatus('online');
        onStatusChange(true, 'online');
        return;
      }
    } catch (localError) {
      console.log('Erro no fallback localhost:', localError);
    }
    
    console.log('Servidor offline');
    setServerStatus('offline');
    onStatusChange(false, 'offline');
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
