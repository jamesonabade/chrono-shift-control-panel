
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Edit, Trash, Save, Loader } from 'lucide-react';
import { getApiEndpoint } from '@/utils/apiEndpoints';

interface User {
  username: string;
  permissions: {
    date: boolean;
    database: boolean;
    scripts: boolean;
    commands: boolean;
    users: boolean;
    logs: boolean;
    config: boolean;
  };
  created_at?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiEndpoint('/api/users'), {
        headers: {
          'x-user': localStorage.getItem('currentUser') || 'system'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar usuários",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Erro",
        description: "Username e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(getApiEndpoint('/api/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user': localStorage.getItem('currentUser') || 'system'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers(); // Recarregar lista
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
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar usuário",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao criar usuário",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (username: string) => {
    if (username === 'administrador') {
      toast({
        title: "Erro",
        description: "Não é possível remover o administrador",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(getApiEndpoint(`/api/users/${username}`), {
        method: 'DELETE',
        headers: {
          'x-user': localStorage.getItem('currentUser') || 'system'
        }
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers(); // Recarregar lista
        toast({
          title: "Usuário removido!",
          description: `${username} foi removido do sistema`,
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao remover usuário",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao remover usuário",
        variant: "destructive"
      });
    }
  };

  const updatePermission = async (username: string, permission: keyof User['permissions'], value: boolean) => {
    if (username === 'administrador') {
      toast({
        title: "Aviso",
        description: "Permissões do administrador não podem ser alteradas",
        variant: "destructive"
      });
      return;
    }

    const user = users.find(u => u.username === username);
    if (!user) return;

    const updatedPermissions = {
      ...user.permissions,
      [permission]: value
    };

    try {
      const response = await fetch(getApiEndpoint(`/api/users/${username}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user': localStorage.getItem('currentUser') || 'system'
        },
        body: JSON.stringify({ permissions: updatedPermissions })
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers(); // Recarregar lista
        toast({
          title: "Permissão atualizada!",
          description: `Permissão ${permission} para ${username} foi ${value ? 'concedida' : 'removida'}`,
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar permissão",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao atualizar permissão",
        variant: "destructive"
      });
    }
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

  const currentUser = localStorage.getItem('currentUser');
  const isAdmin = currentUser === 'administrador';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="ml-2 text-slate-400">Carregando usuários...</span>
      </div>
    );
  }

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
        {users.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.username} className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">
                  {user.username}
                  {user.username === 'administrador' && (
                    <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </h4>
                <div className="flex space-x-2">
                  {user.username !== 'administrador' && (
                    <Button
                      onClick={() => deleteUser(user.username)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(user.permissions).map(([permission, hasPermission]) => (
                  <div key={permission} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                    <span className="text-slate-300 text-sm">{getPermissionLabel(permission)}</span>
                    <Switch
                      checked={hasPermission}
                      onCheckedChange={(checked) => 
                        updatePermission(user.username, permission as keyof User['permissions'], checked)
                      }
                      disabled={user.username === 'administrador'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManagement;
