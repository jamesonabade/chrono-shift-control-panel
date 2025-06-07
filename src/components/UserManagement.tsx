
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Edit, Trash2, Save } from 'lucide-react';

interface User {
  username: string;
  password: string;
  permissions: {
    date: boolean;
    database: boolean;
    scripts: boolean;
    commands: boolean;
    users: boolean;
    logs: boolean;
    config: boolean;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    permissions: {
      date: false,
      database: false,
      scripts: false,
      commands: false,
      users: false,
      logs: false,
      config: false
    }
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // Carregar credenciais
    const savedCredentials = localStorage.getItem('userCredentials');
    const savedPermissions = localStorage.getItem('userPermissions');
    
    if (savedCredentials) {
      const credentials = JSON.parse(savedCredentials);
      const permissions = JSON.parse(savedPermissions || '{}');
      
      const combinedUsers: Record<string, User> = {};
      
      // Incluir todos os usuários, incluindo administrador e usuario padrão
      Object.keys(credentials).forEach(username => {
        if (username === 'administrador') {
          combinedUsers[username] = {
            username,
            password: credentials[username],
            permissions: {
              date: true,
              database: true,
              scripts: true,
              commands: true,
              users: true,
              logs: true,
              config: true
            }
          };
        } else {
          combinedUsers[username] = {
            username,
            password: credentials[username],
            permissions: permissions[username] || {
              date: false,
              database: false,
              scripts: false,
              commands: false,
              users: false,
              logs: false,
              config: false
            }
          };
        }
      });
      
      setUsers(combinedUsers);
    }
  };

  const saveUsers = () => {
    const usersData: Record<string, string> = {};
    const permissionsData: Record<string, any> = {};
    
    Object.values(users).forEach(user => {
      usersData[user.username] = user.password;
      if (user.username !== 'administrador') {
        permissionsData[user.username] = user.permissions;
      }
    });
    
    localStorage.setItem('userCredentials', JSON.stringify(usersData));
    localStorage.setItem('userPermissions', JSON.stringify(permissionsData));
    
    toast({
      title: "Usuários salvos!",
      description: "Alterações foram aplicadas com sucesso",
    });
  };

  const addUser = () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Erro",
        description: "Username e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (users[newUser.username]) {
      toast({
        title: "Erro",
        description: "Este usuário já existe",
        variant: "destructive"
      });
      return;
    }

    setUsers(prev => ({
      ...prev,
      [newUser.username]: { ...newUser }
    }));

    setNewUser({
      username: '',
      password: '',
      permissions: {
        date: false,
        database: false,
        scripts: false,
        commands: false,
        users: false,
        logs: false,
        config: false
      }
    });
    
    setShowAddDialog(false);
    
    toast({
      title: "Usuário adicionado!",
      description: `${newUser.username} foi criado com sucesso`,
    });
  };

  const deleteUser = (username: string) => {
    if (username === 'administrador') {
      toast({
        title: "Erro",
        description: "Não é possível remover o administrador",
        variant: "destructive"
      });
      return;
    }

    setUsers(prev => {
      const newUsers = { ...prev };
      delete newUsers[username];
      return newUsers;
    });
    
    toast({
      title: "Usuário removido!",
      description: `${username} foi removido do sistema`,
    });
  };

  const updatePermission = (username: string, permission: keyof User['permissions'], value: boolean) => {
    if (username === 'administrador') {
      toast({
        title: "Aviso",
        description: "Permissões do administrador não podem ser alteradas",
        variant: "destructive"
      });
      return;
    }

    setUsers(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        permissions: {
          ...prev[username].permissions,
          [permission]: value
        }
      }
    }));
  };

  const updatePassword = (username: string, newPassword: string) => {
    setUsers(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        password: newPassword
      }
    }));
  };

  const getPermissionLabel = (key: string) => {
    const labels: Record<string, string> = {
      date: 'Data',
      database: 'Banco',
      scripts: 'Scripts',
      commands: 'Comandos',
      users: 'Usuários',
      logs: 'Logs',
      config: 'Configurações'
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-emerald-400">Gerenciamento de Usuários</h3>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-emerald-500/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-400">Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Username</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Senha</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-300">Permissões</Label>
                {Object.entries(newUser.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-400">{getPermissionLabel(key)}</span>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setNewUser(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, [key]: checked }
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              
              <Button onClick={addUser} className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {Object.keys(users).length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          Object.entries(users).map(([username, user]) => (
            <div key={username} className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">
                  {username}
                  {username === 'administrador' && (
                    <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </h4>
                <div className="flex space-x-2">
                  {username !== 'administrador' && (
                    <>
                      <Button
                        onClick={() => setEditingUser(editingUser === username ? null : username)}
                        variant="outline"
                        size="sm"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteUser(username)}
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {editingUser === username && username !== 'administrador' && (
                <div className="space-y-3 mb-4 p-3 bg-slate-700/30 rounded">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nova Senha</Label>
                    <Input
                      type="password"
                      value={user.password}
                      onChange={(e) => updatePassword(username, e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(user.permissions).map(([permission, hasPermission]) => (
                  <div key={permission} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                    <span className="text-slate-300 text-sm">{getPermissionLabel(permission)}</span>
                    <Switch
                      checked={hasPermission}
                      onCheckedChange={(checked) => 
                        updatePermission(username, permission as keyof User['permissions'], checked)
                      }
                      disabled={username === 'administrador'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Button onClick={saveUsers} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
        <Save className="w-4 h-4 mr-2" />
        Salvar Alterações
      </Button>
    </div>
  );
};

export default UserManagement;
