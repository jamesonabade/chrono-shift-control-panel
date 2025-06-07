
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Trash, Plus } from 'lucide-react';

export const SystemVariablesPanel = () => {
  const [systemVariables, setSystemVariables] = useState<any>({});
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [newVariableType, setNewVariableType] = useState('');
  const [showAddVariable, setShowAddVariable] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadSystemVariables();
  }, []);

  const loadSystemVariables = () => {
    const saved = localStorage.getItem('systemVariables');
    if (saved) {
      setSystemVariables(JSON.parse(saved));
    }
  };

  const addSystemVariable = () => {
    if (!newVariableName || !newVariableValue || !newVariableType) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos da variável",
        variant: "destructive"
      });
      return;
    }

    const updated = { ...systemVariables };
    if (!updated[newVariableType]) {
      updated[newVariableType] = {};
    }
    
    updated[newVariableType][newVariableName] = newVariableValue;
    setSystemVariables(updated);
    
    setNewVariableName('');
    setNewVariableValue('');
    setNewVariableType('');
    setShowAddVariable(false);
    
    toast({
      title: "Variável adicionada!",
      description: `${newVariableName}=${newVariableValue} foi criada`,
    });
  };

  const removeSystemVariable = (type: string, name: string) => {
    const updated = { ...systemVariables };
    if (updated[type] && updated[type][name]) {
      delete updated[type][name];
      if (Object.keys(updated[type]).length === 0) {
        delete updated[type];
      }
      setSystemVariables(updated);
      
      toast({
        title: "Variável removida",
        description: `${name} foi excluída`,
      });
    }
  };

  const saveSystemVariables = () => {
    localStorage.setItem('systemVariables', JSON.stringify(systemVariables));
    toast({
      title: "Variáveis salvas!",
      description: "Todas as variáveis foram persistidas",
    });
  };

  const getAllVariables = () => {
    const allVars: Array<{type: string, name: string, value: string}> = [];
    Object.keys(systemVariables).forEach(type => {
      Object.keys(systemVariables[type]).forEach(name => {
        allVars.push({
          type,
          name,
          value: systemVariables[type][name]
        });
      });
    });
    return allVars;
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-slate-300">Variáveis do Sistema</h4>
        <Button
          onClick={() => setShowAddVariable(true)}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Variável
        </Button>
      </div>

      {showAddVariable && (
        <div className="p-4 bg-slate-700/30 rounded border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-slate-300">Tipo</Label>
              <Select value={newVariableType} onValueChange={setNewVariableType}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="database">Banco</SelectItem>
                  <SelectItem value="general">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Chave</Label>
              <Input
                value={newVariableName}
                onChange={(e) => setNewVariableName(e.target.value)}
                placeholder="Nome da variável"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Valor</Label>
              <Input
                value={newVariableValue}
                onChange={(e) => setNewVariableValue(e.target.value)}
                placeholder="Valor da variável"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={addSystemVariable} size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setShowAddVariable(false)} 
                size="sm" 
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {getAllVariables().length === 0 ? (
          <p className="text-slate-400 text-center py-4">Nenhuma variável configurada</p>
        ) : (
          getAllVariables().map((variable, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/20 rounded border border-slate-600/50">
              <div className="flex items-center space-x-4">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded font-mono">
                  {variable.type.toUpperCase()}
                </span>
                <span className="text-white font-mono">
                  {variable.name}={variable.value}
                </span>
              </div>
              <Button
                onClick={() => removeSystemVariable(variable.type, variable.name)}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Button onClick={saveSystemVariables} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Salvar Variáveis
      </Button>
    </div>
  );
};
