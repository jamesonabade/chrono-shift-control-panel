
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
    if (authStatus === 'true') {
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
    setShowCustomization(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="relative">
      <Dashboard onLogout={handleLogout} />
      
      {/* Botão de personalização - apenas após login */}
      <Button
        onClick={() => setShowCustomization(!showCustomization)}
        className="fixed top-4 right-4 bg-slate-800/80 backdrop-blur-lg border-cyan-500/30 hover:bg-slate-700/80 z-30"
        variant="outline"
        size="sm"
      >
        🎨 Personalizar Login
      </Button>

      <CustomizeLogin 
        show={showCustomization} 
        onClose={() => setShowCustomization(false)} 
      />
    </div>
  );
};

export default Index;
