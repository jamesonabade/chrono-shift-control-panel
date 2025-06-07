
import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    
    // Log da ação de login
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'USER_LOGIN',
      details: {
        user: localStorage.getItem('currentUser'),
        success: true
      },
      message: 'Login realizado com sucesso'
    };
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
  };

  const handleLogout = () => {
    // Log da ação de logout
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'USER_LOGOUT',
      details: {
        user: localStorage.getItem('currentUser'),
        success: true
      },
      message: 'Logout realizado com sucesso'
    };
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
    
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    
    // Limpar personalizações de background no logout
    document.body.style.backgroundImage = '';
    const overlay = document.getElementById('dashboard-overlay');
    if (overlay) {
      overlay.remove();
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
};

export default Index;
