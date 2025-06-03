
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
      logs: false
    }
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('registeredUsers');
    const savedPermissions = localStorage.getItem('userPermissions');
    
    if (savedUsers && savedPermissions) {
      const usersData = JSON.parse(savedUsers);
      const permissionsData = JSON.parse(savedPermissions);
      
      const combinedUsers: Record<string, User> = {};
      Object.keys(usersData).forEach(username => {
        if (username !== 'administrador') {
          combinedUsers[username] = {
            username,
            password: usersData[username],
            permissions: permissionsData[username] || {
              date: false,
              database: false,
              scripts: false,
              commands: false,
              users: false,
              logs: false
            }
          };
        }
      });
      
      setUsers(combinedUsers);
    }
  };

  const saveUsers = () => {
    const usersData: Record<string, string> = { administrador: 'admin123' };
    const permissionsData: Record<string, any> = {};
    
    Object.values(users).forEach(user => {
      usersData[user.username] = user.password;
      permissionsData[user.username] = user.permissions;
    });
    
    localStorage.setItem('registeredUsers', JSON.stringify(usersData));
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

    if (users[newUser.username] || newUser.username === 'administrador') {
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
        logs: false
      }
    });
    
    setShowAddDialog(false);
    
    toast({
      title: "Usuário adicionado!",
      description: `${newUser.username} foi criado com sucesso`,
    });
  };

  const deleteUser = (username: string) => {
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
          <DialogContent className="bg-slate-800 border-emerald-500/30">
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
                    <span className="text-slate-400 capitalize">
                      {key === 'commands' ? 'Comandos' : 
                       key === 'users' ? 'Usuários' : 
                       key === 'logs' ? 'Logs' : 
                       key === 'scripts' ? 'Scripts' : 
                       key === 'database' ? 'Banco' : 'Data'}
                    </span>
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
        {Object.entries(users).map(([username, user]) => (
          <div key={username} className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">{username}</h4>
              <div className="flex space-x-2">
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
              </div>
            </div>

            {editingUser === username && (
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
                  <span className="text-slate-300 text-sm capitalize">
                    {permission === 'commands' ? 'Comandos' : 
                     permission === 'users' ? 'Usuários' : 
                     permission === 'logs' ? 'Logs' : 
                     permission === 'scripts' ? 'Scripts' : 
                     permission === 'database' ? 'Banco' : 'Data'}
                  </span>
                  <Switch
                    checked={hasPermission}
                    onCheckedChange={(checked) => 
                      updatePermission(username, permission as keyof User['permissions'], checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={saveUsers} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
        <Save className="w-4 h-4 mr-2" />
        Salvar Alterações
      </Button>
    </div>
  );
};

export default UserManagement;
