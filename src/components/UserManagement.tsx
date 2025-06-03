import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, User, Edit, Trash2, Calendar, Database, FileCode, Terminal, FileText, Shield } from 'lucide-react';

interface User {
  id: string;
  username: string;
  password?: string;
  permissions: {
    date: boolean;
    database: boolean;
    scripts: boolean;
    commands: boolean;
    users: boolean;
    logs: boolean;
  };
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', permissions: {
    date: false,
    database: false,
    scripts: false,
    commands: false,
    users: false,
    logs: false
  } });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const defaultPermissions = {
    date: false,
    database: false,
    scripts: false,
    commands: false,
    users: false,
    logs: false
  };

  const loadUsers = () => {
    const saved = localStorage.getItem('users');
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      // Usuário administrador padrão
      const adminUser: User = {
        id: '1',
        username: 'administrador',
        password: 'admin',
        permissions: {
          date: true,
          database: true,
          scripts: true,
          commands: true,
          users: true,
          logs: true
        },
        createdAt: new Date().toISOString()
      };
      setUsers([adminUser]);
      localStorage.setItem('users', JSON.stringify([adminUser]));
    }
  };

  const addUser = () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Erro",
        description: "Nome de usuário e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (users.some(u => u.username === newUser.username)) {
      toast({
        title: "Erro", 
        description: "Nome de usuário já existe",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      password: newUser.password,
      permissions: { ...defaultPermissions, ...newUser.permissions },
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    setNewUser({ username: '', password: '', permissions: defaultPermissions });
    setShowAddDialog(false);

    toast({
      title: "Usuário criado!",
      description: `${user.username} foi adicionado com sucesso`,
    });
  };

  const editUser = () => {
    if (!editingUser) return;

    const updatedUsers = users.map(u => 
      u.id === editingUser.id ? editingUser : u
    );
    saveUsers(updatedUsers);
    setShowEditDialog(false);
    setEditingUser(null);

    toast({
      title: "Usuário atualizado!",
      description: `${editingUser.username} foi atualizado`,
    });
  };

  const deleteUser = (id: string) => {
    const updatedUsers = users.filter(user => user.id !== id);
    saveUsers(updatedUsers);

    toast({
      title: "Usuário removido!",
      description: "Usuário removido com sucesso",
    });
  };

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Atualizar permissões no localStorage
    const userPermissions: { [username: string]: any } = {};
    updatedUsers.forEach(user => {
      userPermissions[user.username] = user.permissions;
    });
    localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'scripts': return <FileCode className="w-4 h-4" />;
      case 'commands': return <Terminal className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'logs': return <FileText className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'date': return 'Alteração de Data';
      case 'database': return 'Restauração de Banco';
      case 'scripts': return 'Gerenciar Scripts';
      case 'commands': return 'Comandos Personalizados';
      case 'users': return 'Gerenciar Usuários';
      case 'logs': return 'Visualizar Logs';
      default: return permission;
    }
  };

  const renderPermissionCheckbox = (permissions: any, setPermissions: any, permission: string) => (
    <div key={permission} className="flex items-center space-x-3 p-2 hover:bg-slate-600/30 rounded">
      <input
        type="checkbox"
        id={permission}
        checked={permissions[permission] || false}
        onChange={(e) => setPermissions({ ...permissions, [permission]: e.target.checked })}
        className="rounded border-slate-600"
      />
      <label htmlFor={permission} className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
        {getPermissionIcon(permission)}
        <span>{getPermissionLabel(permission)}</span>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-emerald-400">Gerenciamento de Usuários</h3>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-emerald-500/30 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-emerald-400">Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome de usuário"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Permissões</Label>
                <div className="grid grid-cols-2 gap-2 bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
                  {Object.keys(defaultPermissions).map(permission => 
                    renderPermissionCheckbox(newUser.permissions, 
                      (perms: any) => setNewUser({ ...newUser, permissions: perms }), 
                      permission)
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={addUser} className="bg-emerald-600 hover:bg-emerald-700">
                  Criar Usuário
                </Button>
                <Button 
                  onClick={() => setShowAddDialog(false)} 
                  variant="outline"
                  className="border-slate-600"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <div className="p-6 bg-slate-700/30 rounded-lg border border-slate-600/30 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-white font-medium">{user.username}</h4>
                    {user.username === 'administrador' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(user.permissions).map(([perm, hasAccess]) => 
                      hasAccess && (
                        <span key={perm} className="flex items-center space-x-1 px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {getPermissionIcon(perm)}
                          <span>{getPermissionLabel(perm)}</span>
                        </span>
                      )
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-2">
                    Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      setEditingUser(user);
                      setShowEditDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                    disabled={user.username === 'administrador'}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteUser(user.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    disabled={user.username === 'administrador'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 border-blue-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome de usuário"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  disabled={editingUser.username === 'administrador'}
                />
                <Input
                  type="password"
                  placeholder="Nova senha (deixe vazio para manter)"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Permissões</Label>
                <div className="grid grid-cols-2 gap-2 bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
                  {Object.keys(defaultPermissions).map(permission => 
                    renderPermissionCheckbox(editingUser.permissions, 
                      (perms: any) => setEditingUser({ ...editingUser, permissions: perms }), 
                      permission)
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={editUser} className="bg-blue-600 hover:bg-blue-700">
                  Salvar Alterações
                </Button>
                <Button 
                  onClick={() => setShowEditDialog(false)} 
                  variant="outline"
                  className="border-slate-600"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
