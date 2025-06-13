
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Play, Plus, Edit, Trash2, Settings, Calendar, Database, Terminal } from 'lucide-react';

interface Command {
  id: string;
  name: string;
  command: string;
  description?: string;
  category: 'date' | 'database' | 'custom';
  linkedToButton?: boolean;
  createdAt: string;
}

const CommandManager = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [newCommand, setNewCommand] = useState({ 
    name: '', 
    command: '', 
    description: '', 
    category: 'custom' as 'date' | 'database' | 'custom',
    linkedToButton: false 
  });
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'date' | 'database' | 'custom'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = () => {
    const saved = localStorage.getItem('customCommands');
    if (saved) {
      setCommands(JSON.parse(saved));
    } else {
      // Comandos padrão
      const defaultCommands: Command[] = [
        {
          id: '1',
          name: 'Aplicar Data',
          command: 'echo "Alterando data para $NEW_DATE"',
          description: 'Comando para alteração de data do sistema',
          category: 'date',
          linkedToButton: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Restaurar Banco',
          command: 'echo "Restaurando banco no ambiente $ENVIRONMENT"',
          description: 'Comando para restauração do banco de dados',
          category: 'database',
          linkedToButton: true,
          createdAt: new Date().toISOString()
        }
      ];
      setCommands(defaultCommands);
      localStorage.setItem('customCommands', JSON.stringify(defaultCommands));
      
      // Atualizar o sistema de botões vinculados
      updateButtonCommands(defaultCommands);
    }
  };

  const updateButtonCommands = (commandList: Command[]) => {
    const buttonCommands = {
      date: commandList.filter(cmd => cmd.category === 'date' && cmd.linkedToButton).map(cmd => cmd.id),
      database: commandList.filter(cmd => cmd.category === 'database' && cmd.linkedToButton).map(cmd => cmd.id)
    };
    localStorage.setItem('buttonCommands', JSON.stringify(buttonCommands));
  };

  const saveCommands = (updatedCommands: Command[]) => {
    setCommands(updatedCommands);
    localStorage.setItem('customCommands', JSON.stringify(updatedCommands));
    updateButtonCommands(updatedCommands);
  };

  const addCommand = () => {
    if (!newCommand.name || !newCommand.command) {
      toast({
        title: "Erro",
        description: "Nome e comando são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const command: Command = {
      id: Date.now().toString(),
      name: newCommand.name,
      command: newCommand.command,
      description: newCommand.description,
      category: newCommand.category,
      linkedToButton: newCommand.linkedToButton,
      createdAt: new Date().toISOString()
    };

    const updatedCommands = [...commands, command];
    saveCommands(updatedCommands);
    setNewCommand({ name: '', command: '', description: '', category: 'custom', linkedToButton: false });
    setShowAddDialog(false);

    toast({
      title: "Comando adicionado!",
      description: `${command.name} foi criado com sucesso`,
    });
  };

  const editCommand = () => {
    if (!editingCommand) return;

    const updatedCommands = commands.map(cmd => 
      cmd.id === editingCommand.id ? editingCommand : cmd
    );
    saveCommands(updatedCommands);
    setShowEditDialog(false);
    setEditingCommand(null);

    toast({
      title: "Comando atualizado!",
      description: `${editingCommand.name} foi atualizado`,
    });
  };

  const deleteCommand = (id: string) => {
    const updatedCommands = commands.filter(cmd => cmd.id !== id);
    saveCommands(updatedCommands);

    toast({
      title: "Comando removido!",
      description: "Comando foi removido com sucesso",
    });
  };

  const toggleButtonLink = (command: Command) => {
    const updatedCommands = commands.map(cmd => {
      if (cmd.id === command.id) {
        return { ...cmd, linkedToButton: !cmd.linkedToButton };
      }
      return cmd;
    });
    
    saveCommands(updatedCommands);
    
    toast({
      title: command.linkedToButton ? "Comando desvinculado" : "Comando vinculado",
      description: command.linkedToButton ? 
        `${command.name} não será mais usado pelo botão` : 
        `${command.name} será usado pelo botão de ${getCategoryLabel(command.category)}`,
    });
  };

  const executeCommand = async (command: Command) => {
    setIsExecuting(command.id);

    try {
      const response = await fetch('http://localhost:3001/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command.command,
          name: command.name,
          description: command.description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Comando executado!",
          description: `${command.name} foi executado com sucesso`,
        });
      } else {
        toast({
          title: "Erro na execução",
          description: result.error || `Falha ao executar ${command.name}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na execução:', error);
      toast({
        title: "Erro",
        description: `Erro ao executar comando: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsExecuting(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'date': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'database': return <Database className="w-4 h-4 text-green-400" />;
      default: return <Terminal className="w-4 h-4 text-purple-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'date': return 'Data/Hora';
      case 'database': return 'Banco de Dados';
      default: return 'Personalizado';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'date': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'database': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const filteredCommands = commands.filter(cmd => 
    selectedCategory === 'all' || cmd.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-purple-400">Comandos Personalizados</h3>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={(value: 'all' | 'date' | 'database' | 'custom') => setSelectedCategory(value)}>
            <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
              <SelectItem value="date" className="text-white hover:bg-slate-700">Data/Hora</SelectItem>
              <SelectItem value="database" className="text-white hover:bg-slate-700">Banco</SelectItem>
              <SelectItem value="custom" className="text-white hover:bg-slate-700">Personalizados</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Comando
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-green-500/30">
              <DialogHeader>
                <DialogTitle className="text-green-400">Adicionar Novo Comando</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do comando"
                  value={newCommand.name}
                  onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Input
                  placeholder="Comando a ser executado"
                  value={newCommand.command}
                  onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Textarea
                  placeholder="Descrição (opcional)"
                  value={newCommand.description}
                  onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Select 
                  value={newCommand.category} 
                  onValueChange={(value: 'date' | 'database' | 'custom') => setNewCommand({ ...newCommand, category: value })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="custom" className="text-white hover:bg-slate-700">Personalizado</SelectItem>
                    <SelectItem value="date" className="text-white hover:bg-slate-700">Data/Hora</SelectItem>
                    <SelectItem value="database" className="text-white hover:bg-slate-700">Banco de Dados</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="linkedToButton"
                    checked={newCommand.linkedToButton}
                    onChange={(e) => setNewCommand({ ...newCommand, linkedToButton: e.target.checked })}
                    className="rounded border-slate-600"
                  />
                  <label htmlFor="linkedToButton" className="text-sm text-slate-300">
                    Vincular ao botão da categoria
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addCommand} className="bg-green-600 hover:bg-green-700">
                    Adicionar
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
      </div>

      {filteredCommands.length === 0 ? (
        <div className="p-6 bg-slate-700/30 rounded-lg border border-slate-600/30 text-center">
          <Settings className="w-12 h-12 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Nenhum comando na categoria selecionada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCommands.map((command) => (
            <div key={command.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-white font-medium">{command.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(command.category)}`}>
                      {getCategoryLabel(command.category)}
                    </span>
                    {command.linkedToButton && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        Vinculado ao Botão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {command.description || 'Sem descrição'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {command.command}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => executeCommand(command)}
                    disabled={isExecuting === command.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {isExecuting === command.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => toggleButtonLink(command)}
                    variant="outline"
                    size="sm"
                    className={command.linkedToButton ? 
                      "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20" :
                      "border-slate-500/50 text-slate-400 hover:bg-slate-500/20"
                    }
                    title={command.linkedToButton ? "Desvincular do botão" : "Vincular ao botão"}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCommand(command);
                      setShowEditDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteCommand(command.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
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
        <DialogContent className="bg-slate-800 border-yellow-500/30">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Editar Comando</DialogTitle>
          </DialogHeader>
          {editingCommand && (
            <div className="space-y-4">
              <Input
                placeholder="Nome do comando"
                value={editingCommand.name}
                onChange={(e) => setEditingCommand({ ...editingCommand, name: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Input
                placeholder="Comando a ser executado"
                value={editingCommand.command}
                onChange={(e) => setEditingCommand({ ...editingCommand, command: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={editingCommand.description || ''}
                onChange={(e) => setEditingCommand({ ...editingCommand, description: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Select 
                value={editingCommand.category} 
                onValueChange={(value: 'date' | 'database' | 'custom') => setEditingCommand({ ...editingCommand, category: value })}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="custom" className="text-white hover:bg-slate-700">Personalizado</SelectItem>
                  <SelectItem value="date" className="text-white hover:bg-slate-700">Data/Hora</SelectItem>
                  <SelectItem value="database" className="text-white hover:bg-slate-700">Banco de Dados</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editLinkedToButton"
                  checked={editingCommand.linkedToButton || false}
                  onChange={(e) => setEditingCommand({ ...editingCommand, linkedToButton: e.target.checked })}
                  className="rounded border-slate-600"
                />
                <label htmlFor="editLinkedToButton" className="text-sm text-slate-300">
                  Vincular ao botão da categoria
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={editCommand} className="bg-yellow-600 hover:bg-yellow-700">
                  Salvar
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

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>Dica:</strong> Para usar variáveis nos comandos, utilize a sintaxe $NOME_VARIAVEL. 
          Exemplo: echo "Data: $NEW_DATE" ou mysql -u root -p$DB_PASSWORD
        </p>
      </div>
    </div>
  );
};

export default CommandManager;
