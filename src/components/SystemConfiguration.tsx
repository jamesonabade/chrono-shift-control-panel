
import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { ServerStatus } from './system-config/ServerStatus';
import { CustomizationsPanel } from './system-config/CustomizationsPanel';
import { SystemVariablesPanel } from './system-config/SystemVariablesPanel';
import { getApiEndpoint } from '@/utils/apiEndpoints';

const SystemConfiguration = () => {
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const handleServerStatusChange = (isOnline: boolean, status: 'checking' | 'online' | 'offline') => {
    setIsServerAvailable(isOnline);
    setServerStatus(status);
  };

  const loadCustomizations = async () => {
    try {
      if (isServerAvailable) {
        const customizationsUrl = getApiEndpoint('/api/customizations');
        console.log('🔄 Carregando personalizações:', customizationsUrl);
        
        const response = await fetch(customizationsUrl);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Personalizações carregadas:', data);
          // Handle customizations loading if needed
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar personalizações:', error);
    }
  };

  useEffect(() => {
    if (isServerAvailable) {
      loadCustomizations();
    }
  }, [isServerAvailable]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-400">Configurações do Sistema</h3>
        </div>
        <ServerStatus onStatusChange={handleServerStatusChange} />
      </div>

      <CustomizationsPanel isServerAvailable={isServerAvailable} />
      
      <SystemVariablesPanel />
    </div>
  );
};

export default SystemConfiguration;
