
import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import CustomizeLogin from '@/components/CustomizeLogin';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já está logado
    const authStatus = localStorage.getItem('isAuthenticated');
    const currentUser = localStorage.getItem('currentUser');
    if (authStatus === 'true' && currentUser) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setShowCustomization(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const currentUser = localStorage.getItem('currentUser');
  const isAdmin = currentUser === 'administrador';
  
  // Verificar se usuário tem todas as permissões
  const hasAllPermissions = () => {
    if (currentUser === 'administrador') return true;
    
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    const permissions = userPermissions[currentUser || ''] || {};
    
    return permissions.date && permissions.database && permissions.scripts && permissions.users && permissions.logs;
  };

  const canCustomize = isAdmin || hasAllPermissions();

  return (
    <div className="relative">
      <Dashboard onLogout={handleLogout} />
      
      {/* Botão de personalização - para admin ou usuários com todas as permissões */}
      {canCustomize && (
        <Button
          onClick={() => setShowCustomization(!showCustomization)}
          className="fixed top-4 right-4 bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 hover:bg-slate-700/80 z-30"
          variant="outline"
          size="sm"
        >
          🎨 Personalizar Sistema
        </Button>
      )}

      {canCustomize && (
        <CustomizeLogin 
          show={showCustomization} 
          onClose={() => setShowCustomization(false)} 
        />
      )}
    </div>
  );
};

export default Index;
