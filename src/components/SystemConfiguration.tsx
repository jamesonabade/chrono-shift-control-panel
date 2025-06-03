
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Plus, Trash2, Palette } from 'lucide-react';
import CustomizeLogin from '@/components/CustomizeLogin';

const SystemConfiguration = () => {
  const [systemVariables, setSystemVariables] = useState({
    date: {} as Record<string, string>,
    database: {} as Record<string, string>
  });
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [activeTab, setActiveTab] = useState('variables');
  const [showCustomization, setShowCustomization] = useState(false);
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

  const saveSystemVariables = async () => {
    try {
      localStorage.setItem('systemVariables', JSON.stringify(systemVariables));
      
      // Tentar salvar no backend também
      try {
        await fetch('http://localhost:3001/api/system-variables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(systemVariables)
        });
      } catch (error) {
        console.warn('Erro ao salvar no backend, salvando apenas localmente:', error);
      }

      toast({
        title: "Configurações salvas!",
        description: "Variáveis do sistema foram atualizadas",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      });
    }
  };

  const addVariable = (type: 'date' | 'database') => {
    if (!newVarKey.trim() || !newVarValue.trim()) {
      toast({
        title: "Erro",
        description: "Chave e valor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSystemVariables(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [newVarKey]: newVarValue
      }
    }));

    setNewVarKey('');
    setNewVarValue('');
    
    toast({
      title: "Variável adicionada!",
      description: `${newVarKey} adicionada ao tipo ${type}`,
    });
  };

  const removeVariable = (type: 'date' | 'database', key: string) => {
    setSystemVariables(prev => {
      const newVars = { ...prev[type] };
      delete newVars[key];
      return {
        ...prev,
        [type]: newVars
      };
    });

    toast({
      title: "Variável removida!",
      description: `${key} removida do tipo ${type}`,
    });
  };

  const updateVariable = (type: 'date' | 'database', key: string, value: string) => {
    setSystemVariables(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  const renderVariableEditor = (type: 'date' | 'database') => (
    <div className="space-y-4">
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
        <h4 className="text-slate-300 mb-3 font-semibold">
          Variáveis para {type === 'date' ? 'Data' : 'Banco de Dados'}
        </h4>
        
        <div className="space-y-3">
          {Object.entries(systemVariables[type]).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <Input
                value={key}
                disabled
                className="bg-slate-700/50 border-slate-600 text-white flex-1"
                placeholder="Chave"
              />
              <Input
                value={value}
                onChange={(e) => updateVariable(type, key, e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white flex-2"
                placeholder="Valor"
              />
              <Button
                onClick={() => removeVariable(type, key)}
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-slate-700/30 rounded border-l-4 border-blue-500/50">
          <h5 className="text-blue-400 font-semibold mb-2">Adicionar Nova Variável</h5>
          <div className="flex gap-2">
            <Input
              value={newVarKey}
              onChange={(e) => setNewVarKey(e.target.value)}
              placeholder="Nome da variável"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Input
              value={newVarValue}
              onChange={(e) => setNewVarValue(e.target.value)}
              placeholder="Valor da variável"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Button
              onClick={() => addVariable(type)}
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-700/20 rounded">
          <p className="text-sm text-slate-400">
            <strong>Info:</strong> Essas variáveis serão automaticamente incluídas quando os botões 
            {type === 'date' ? ' "Aplicar Data"' : ' "Restaurar Banco"'} forem executados.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-purple-400">Configurações do Sistema</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="variables">Variáveis do Sistema</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>
        
        <TabsContent value="variables" className="space-y-4">
          <Tabs defaultValue="date" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="date">Variáveis de Data</TabsTrigger>
              <TabsTrigger value="database">Variáveis de Banco</TabsTrigger>
            </TabsList>
            
            <TabsContent value="date" className="space-y-4">
              {renderVariableEditor('date')}
            </TabsContent>
            
            <TabsContent value="database" className="space-y-4">
              {renderVariableEditor('database')}
            </TabsContent>
          </Tabs>

          <Button 
            onClick={saveSystemVariables}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3"
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar Variáveis
          </Button>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Importante:</strong> As variáveis configuradas aqui serão automaticamente incluídas 
              na execução dos comandos dos botões "Aplicar Data" e "Restaurar Banco". Elas complementam 
              as variáveis específicas de cada ação (como a data selecionada ou ambiente).
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <h4 className="text-lg font-semibold text-cyan-400">Personalização Visual</h4>
              </div>
              <Button
                onClick={() => setShowCustomization(!showCustomization)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {showCustomization ? 'Ocultar' : 'Personalizar'}
              </Button>
            </div>
            
            {showCustomization && (
              <div className="mt-4">
                <CustomizeLogin 
                  show={showCustomization} 
                  onClose={() => setShowCustomization(false)} 
                />
              </div>
            )}
            
            {!showCustomization && (
              <p className="text-slate-400 text-sm">
                Configure papéis de parede, logos, favicons e textos do sistema.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfiguration;
