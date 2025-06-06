
import { useState, useEffect } from 'react';

interface ServerStatusProps {
  onStatusChange: (isOnline: boolean, status: 'checking' | 'online' | 'offline') => void;
}

export const ServerStatus = ({ onStatusChange }: ServerStatusProps) => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [healthCheckUrl, setHealthCheckUrl] = useState<string>('');

  const getServerUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    console.log('Hostname atual:', hostname);
    console.log('Protocolo:', protocol);
    console.log('Porta atual:', window.location.port);
    
    // Em desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Se estivermos na porta 8080, backend está em 3001
      if (window.location.port === '8080') {
        return 'http://localhost:3001';
      }
      // Se estivermos na porta 3000 ou outra, tentar 3001
      return 'http://localhost:3001';
    }
    
    // Em Docker ou produção
    const basePath = import.meta.env.VITE_BASE_PATH || '';
    if (basePath && basePath !== '/') {
      return `${protocol}//${hostname}${basePath}`;
    }
    
    // Fallback para mesma origem
    return `${protocol}//${hostname}`;
  };

  const checkServerStatus = async () => {
    console.log('Verificando status do servidor...');
    
    const currentServerUrl = getServerUrl();
    const currentHealthUrl = `${currentServerUrl}/api/health`;
    
    setServerUrl(currentServerUrl);
    setHealthCheckUrl(currentHealthUrl);
    
    console.log('URL do servidor:', currentServerUrl);
    console.log('URL de verificação:', currentHealthUrl);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(currentHealthUrl, {
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
      console.log('Erro na verificação:', error);
      
      // Se estamos em localhost, tentar várias portas
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const ports = ['3001', '3000', '8080'];
        
        for (const port of ports) {
          try {
            const fallbackUrl = `http://localhost:${port}/api/health`;
            console.log('Tentando fallback:', fallbackUrl);
            
            const fallbackResponse = await fetch(fallbackUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              console.log(`Servidor online (localhost:${port})`, data);
              setServerUrl(`http://localhost:${port}`);
              setHealthCheckUrl(fallbackUrl);
              setServerStatus('online');
              onStatusChange(true, 'online');
              return;
            }
          } catch (localError) {
            console.log(`Erro no fallback localhost:${port}:`, localError);
          }
        }
      }
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
    <div className="space-y-2">
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        serverStatus === 'online' ? 'bg-green-500/20 text-green-400' :
        serverStatus === 'offline' ? 'bg-red-500/20 text-red-400' :
        'bg-yellow-500/20 text-yellow-400'
      }`}>
        {serverStatus === 'online' ? 'Servidor Online' :
         serverStatus === 'offline' ? 'Servidor Indisponível' :
         'Verificando...'}
      </div>
      
      {/* Informações de debug */}
      <div className="text-xs text-slate-400 space-y-1">
        <div>Backend: <span className="text-cyan-400">{serverUrl || 'Detectando...'}</span></div>
        <div>Health Check: <span className="text-cyan-400">{healthCheckUrl || 'Detectando...'}</span></div>
      </div>
    </div>
  );
};
