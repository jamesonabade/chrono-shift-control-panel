
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
    const port = window.location.port;
    
    console.log('Hostname atual:', hostname);
    console.log('Protocolo:', protocol);
    console.log('Porta atual:', port);
    
    // Em desenvolvimento local direto (sem nginx)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Se estivermos na porta 8080 (frontend direto), backend está em 3001
      if (port === '8080') {
        return 'http://localhost:3001';
      }
      // Se estivermos na porta 80 ou sem porta (através do nginx), usar mesma origem
      if (port === '80' || port === '') {
        return `${protocol}//${hostname}`;
      }
      // Fallback para desenvolvimento
      return 'http://localhost:3001';
    }
    
    // Em produção ou através do nginx (qualquer outro hostname)
    // Usar sempre a mesma origem, pois o nginx faz o proxy
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
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
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
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
      
      // Se estamos em localhost, tentar fallback apenas se não conseguir conectar através do nginx
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Só tentar fallback se estivermos na porta 80 ou sem porta (nginx)
        if (window.location.port === '80' || window.location.port === '') {
          try {
            const fallbackUrl = 'http://localhost:3001/api/health';
            console.log('Tentando fallback direto ao backend:', fallbackUrl);
            
            const fallbackResponse = await fetch(fallbackUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              console.log('Servidor online (fallback direto)', data);
              setServerUrl('http://localhost:3001');
              setHealthCheckUrl(fallbackUrl);
              setServerStatus('online');
              onStatusChange(true, 'online');
              return;
            }
          } catch (localError) {
            console.log('Erro no fallback direto:', localError);
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
        <div>Hostname: <span className="text-cyan-400">{window.location.hostname}</span></div>
        <div>Porta: <span className="text-cyan-400">{window.location.port || '80/443'}</span></div>
      </div>
    </div>
  );
};
