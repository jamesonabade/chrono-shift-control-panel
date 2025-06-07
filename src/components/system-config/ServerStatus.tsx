
import { useState, useEffect } from 'react';
import { getApiConfig, getHealthCheckUrl } from '@/utils/apiEndpoints';

interface ServerStatusProps {
  onStatusChange: (isOnline: boolean, status: 'checking' | 'online' | 'offline') => void;
}

export const ServerStatus = ({ onStatusChange }: ServerStatusProps) => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiConfig, setApiConfig] = useState(getApiConfig());

  const checkServerStatus = async () => {
    console.log('🔄 Verificando status do servidor...');
    
    const currentConfig = getApiConfig();
    setApiConfig(currentConfig);
    
    console.log(`📡 Tentando conectar: ${currentConfig.healthUrl}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(currentConfig.healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Servidor online:', data);
        setServerStatus('online');
        onStatusChange(true, 'online');
        return;
      } else {
        console.log(`❌ Servidor respondeu com erro: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Erro na verificação:', error);
    }
    
    console.log('🔴 Servidor offline');
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
      
      {/* Informações de debug detalhadas */}
      <div className="text-xs text-slate-400 space-y-1">
        <div className="font-medium text-slate-300">Configuração da API:</div>
        <div>Ambiente: <span className={`font-medium ${
          apiConfig.environment === 'development' ? 'text-blue-400' : 'text-purple-400'
        }`}>{apiConfig.environment.toUpperCase()}</span></div>
        <div>Base URL: <span className="text-cyan-400">{apiConfig.baseUrl}</span></div>
        <div>Health Check: <span className="text-cyan-400">{apiConfig.healthUrl}</span></div>
        <div className="pt-1 border-t border-slate-600">
          <div>Host: <span className="text-cyan-400">{window.location.hostname}</span></div>
          <div>Porta: <span className="text-cyan-400">{window.location.port || '80/443'}</span></div>
          <div>Caminho: <span className="text-cyan-400">{window.location.pathname}</span></div>
        </div>
      </div>
    </div>
  );
};
