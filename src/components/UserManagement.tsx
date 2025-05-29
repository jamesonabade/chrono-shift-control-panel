
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, UserPlus, Key, Trash2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  // Carrega usuários salvos no localStorage
  useState(() => {
    const savedUsers = localStorage.getItem('systemUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  });

  const logAction = (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: localStorage.getItem('currentUser') || 'admin'
    };
    
    console.log('USER_MANAGEMENT_LOG:', JSON.stringify(logEntry));
    
    // Salva logs no localStorage para demonstração
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100))); // Mantém últimos 100 logs
  };

  const createUser = () => {
    if (!newUsername || !newPassword) {
      toast({
        title: "Erro",
        description: "Username e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (users.find(u => u.username === newUsername)) {
      toast({
        title: "Erro",
        description: "Usuário já existe",
        variant: "destructive"
      });
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: newUsername,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
    
    // Salva credenciais
    const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    credentials[newUsername] = newPassword;
    localStorage.setItem('userCredentials', JSON.stringify(credentials));

    logAction('CREATE_USER', { username: newUsername, userId: newUser.id });

    toast({
      title: "Usuário criado!",
      description: `Usuário ${newUsername} foi criado com sucesso`
    });

    setNewUsername('');
    setNewPassword('');
  };

  const deleteUser = (user: User) => {
    if (user.username === 'admin') {
      toast({
        title: "Erro",
        description: "Não é possível excluir o usuário admin",
        variant: "destructive"
      });
      return;
    }

    const updatedUsers = users.filter(u => u.id !== user.id);
    setUsers(updatedUsers);
    localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));

    // Remove credenciais
    const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    delete credentials[user.username];
    localStorage.setItem('userCredentials', JSON.stringify(credentials));

    logAction('DELETE_USER', { username: user.username, userId: user.id });

    toast({
      title: "Usuário excluído!",
      description: `Usuário ${user.username} foi excluído`
    });
  };

  const changePassword = () => {
    if (!currentPassword || !newPasswordChange || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (newPasswordChange !== confirmPassword) {
      toast({
        title: "Erro",
        description: "Nova senha e confirmação não coincidem",
        variant: "destructive"
      });
      return;
    }

    const currentUser = localStorage.getItem('currentUser') || 'admin';
    const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{"admin": "admin123"}');
    
    if (credentials[currentUser] !== currentPassword) {
      toast({
        title: "Erro",
        description: "Senha atual incorreta",
        variant: "destructive"
      });
      return;
    }

    credentials[currentUser] = newPasswordChange;
    localStorage.setItem('userCredentials', JSON.stringify(credentials));

    logAction('CHANGE_PASSWORD', { username: currentUser });

    toast({
      title: "Senha alterada!",
      description: "Sua senha foi alterada com sucesso"
    });

    setCurrentPassword('');
    setNewPasswordChange('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="change-password" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
          <TabsTrigger value="change-password" className="data-[state=active]:bg-cyan-500/20">
            Alterar Senha
          </TabsTrigger>
          <TabsTrigger value="manage-users" className="data-[state=active]:bg-cyan-500/20">
            Gerenciar Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="change-password">
          <Card className="bg-slate-700/30 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Input
                type="password"
                placeholder="Nova senha"
                value={newPasswordChange}
                onChange={(e) => setNewPasswordChange(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Button 
                onClick={changePassword}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Key className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-users">
          <div className="space-y-6">
            <Card className="bg-slate-700/30 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Criar Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Nome de usuário"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Button 
                  onClick={createUser}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/30 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Usuários do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Nenhum usuário adicional criado</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg border border-slate-500/30">
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-slate-400 text-sm">
                            Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {user.username !== 'admin' && (
                          <Button
                            onClick={() => deleteUser(user)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
