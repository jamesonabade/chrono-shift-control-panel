
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { User, UserPlus, Key, Trash2, Shield } from 'lucide-react';

interface User {
  id: string;
  username: string;
  createdAt: string;
}

interface UserPermissions {
  date: boolean;
  database: boolean;
  scripts: boolean;
  users: boolean;
  logs: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    date: true,
    database: false,
    scripts: true,
    users: false,
    logs: false
  });
  const { toast } = useToast();

  // Carrega usuários e permissões salvos
  useEffect(() => {
    // Carregar usuários
    const savedUsers = localStorage.getItem('systemUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Criar usuários padrão se não existirem
      const defaultUsers = [
        {
          id: '1',
          username: 'administrador',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          username: 'usuario',
          createdAt: new Date().toISOString()
        }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('systemUsers', JSON.stringify(defaultUsers));
    }
  }, []);

  const logAction = (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      user: localStorage.getItem('currentUser') || 'admin'
    };
    
    console.log('USER_MANAGEMENT_LOG:', JSON.stringify(logEntry));
    
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(-100)));
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

    // Salva permissões padrão
    const permissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    permissions[newUsername] = {
      date: true,
      database: false,
      scripts: true,
      users: false,
      logs: false
    };
    localStorage.setItem('userPermissions', JSON.stringify(permissions));

    logAction('CREATE_USER', { username: newUsername, userId: newUser.id });

    toast({
      title: "Usuário criado!",
      description: `Usuário ${newUsername} foi criado com sucesso`
    });

    setNewUsername('');
    setNewPassword('');
  };

  const deleteUser = (user: User) => {
    if (user.username === 'administrador') {
      toast({
        title: "Erro",
        description: "Não é possível excluir o usuário administrador",
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

    // Remove permissões
    const permissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    delete permissions[user.username];
    localStorage.setItem('userPermissions', JSON.stringify(permissions));

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

    const currentUser = localStorage.getItem('currentUser') || 'administrador';
    const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{"administrador": "admin123"}');
    
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

  const loadUserPermissions = (username: string) => {
    const permissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    const userPerms = permissions[username] || {
      date: true,
      database: false,
      scripts: true,
      users: false,
      logs: false
    };
    setUserPermissions(userPerms);
  };

  const updateUserPermissions = () => {
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um usuário",
        variant: "destructive"
      });
      return;
    }

    if (selectedUser === 'administrador') {
      toast({
        title: "Erro",
        description: "Não é possível alterar permissões do administrador",
        variant: "destructive"
      });
      return;
    }

    const permissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    permissions[selectedUser] = userPermissions;
    localStorage.setItem('userPermissions', JSON.stringify(permissions));

    logAction('UPDATE_PERMISSIONS', { username: selectedUser, permissions: userPermissions });

    toast({
      title: "Permissões atualizadas!",
      description: `Permissões do usuário ${selectedUser} foram atualizadas`
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="change-password" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
          <TabsTrigger value="change-password" className="data-[state=active]:bg-cyan-500/20">
            Alterar Senha
          </TabsTrigger>
          <TabsTrigger value="manage-users" className="data-[state=active]:bg-cyan-500/20">
            Gerenciar Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-cyan-500/20">
            Permissões
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
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg border border-slate-500/30">
                      <div>
                        <p className="text-white font-medium">
                          {user.username}
                          {user.username === 'administrador' && (
                            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Admin</span>
                          )}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {user.username !== 'administrador' && (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="bg-slate-700/30 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Gerenciar Permissões de Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selecionar Usuário
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    if (e.target.value) loadUserPermissions(e.target.value);
                  }}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                >
                  <option value="">Selecione um usuário</option>
                  {users.filter(u => u.username !== 'administrador').map((user) => (
                    <option key={user.id} value={user.username}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="date"
                        checked={userPermissions.date}
                        onCheckedChange={(checked) => 
                          setUserPermissions(prev => ({ ...prev, date: !!checked }))
                        }
                      />
                      <label htmlFor="date" className="text-sm text-white">
                        Acesso à aba Data
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="database"
                        checked={userPermissions.database}
                        onCheckedChange={(checked) => 
                          setUserPermissions(prev => ({ ...prev, database: !!checked }))
                        }
                      />
                      <label htmlFor="database" className="text-sm text-white">
                        Acesso à aba Banco de Dados
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scripts"
                        checked={userPermissions.scripts}
                        onCheckedChange={(checked) => 
                          setUserPermissions(prev => ({ ...prev, scripts: !!checked }))
                        }
                      />
                      <label htmlFor="scripts" className="text-sm text-white">
                        Acesso à aba Scripts
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="users"
                        checked={userPermissions.users}
                        onCheckedChange={(checked) => 
                          setUserPermissions(prev => ({ ...prev, users: !!checked }))
                        }
                      />
                      <label htmlFor="users" className="text-sm text-white">
                        Acesso à aba Usuários
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="logs"
                        checked={userPermissions.logs}
                        onCheckedChange={(checked) => 
                          setUserPermissions(prev => ({ ...prev, logs: !!checked }))
                        }
                      />
                      <label htmlFor="logs" className="text-sm text-white">
                        Acesso à aba Logs
                      </label>
                    </div>
                  </div>

                  <Button 
                    onClick={updateUserPermissions}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Atualizar Permissões
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
