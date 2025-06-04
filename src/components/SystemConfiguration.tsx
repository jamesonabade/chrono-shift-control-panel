import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Upload, Save, Trash, Plus, Download } from 'lucide-react';

const SystemConfiguration = () => {
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [serverTitle, setServerTitle] = useState('');
  const [logoSize, setLogoSize] = useState(48);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  
  // Variáveis do sistema
  const [systemVariables, setSystemVariables] = useState<any>({});
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [newVariableType, setNewVariableType] = useState('');
  const [showAddVariable, setShowAddVariable] = useState(false);

  const { toast } = useToast();

  const getServerUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return `${protocol}//${hostname}`;
  };

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${getServerUrl()}/api/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus('online');
        setIsServerAvailable(true);
      } else {
        setServerStatus('offline');
        setIsServerAvailable(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status do servidor:', error);
      setServerStatus('offline');
      setIsServerAvailable(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    loadSystemVariables();
    loadCustomizations();
    
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemVariables = () => {
    const saved = localStorage.getItem('systemVariables');
    if (saved) {
      setSystemVariables(JSON.parse(saved));
    }
  };

  const loadCustomizations = async () => {
    try {
      if (isServerAvailable) {
        const response = await fetch(`${getServerUrl()}/api/customizations`);
        if (response.ok) {
          const data = await response.json();
          setServerTitle(data.title || '');
          setLogoSize(data.logoSize || 48);
          setBackgroundOpacity(data.backgroundOpacity || 0.5);
        }
      } else {
        // Fallback para localStorage
        setServerTitle(localStorage.getItem('serverTitle') || '');
        setLogoSize(parseInt(localStorage.getItem('logoSize') || '48'));
        setBackgroundOpacity(parseFloat(localStorage.getItem('backgroundOpacity') || '0.5'));
      }
    } catch (error) {
      console.error('Erro ao carregar personalizações:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'background' | 'logo' | 'favicon') => {
    if (!isServerAvailable) {
      toast({
        title: "Servidor indisponível",
        description: "Não é possível fazer upload no momento. Usando armazenamento local.",
        variant: "destructive"
      });
      
      // Fallback para localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'background') {
          localStorage.setItem('loginBackground', result);
        } else if (type === 'logo') {
          localStorage.setItem('loginLogo', result);
        } else if (type === 'favicon') {
          localStorage.setItem('favicon', result);
          updateFavicon(result);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch(`${getServerUrl()}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Upload realizado!",
          description: `${type === 'background' ? 'Papel de parede' : type === 'logo' ? 'Logo' : 'Favicon'} enviado com sucesso`,
        });
        
        if (type === 'favicon') {
          updateFavicon(result.url);
        }
        
        return result.url;
      } else {
        throw new Error('Falha no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao enviar arquivo",
        variant: "destructive"
      });
    }
  };

  const updateFavicon = (iconUrl: string) => {
    const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (favicon) {
      favicon.href = iconUrl;
    }
  };

  const updateTitle = (title: string) => {
    document.title = title || 'chrono-shift-control-panel';
  };

  const saveCustomizations = async () => {
    const customizations = {
      title: serverTitle,
      logoSize,
      backgroundOpacity
    };

    try {
      if (isServerAvailable) {
        const response = await fetch(`${getServerUrl()}/api/customizations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customizations)
        });

        if (response.ok) {
          toast({
            title: "Configurações salvas!",
            description: "Personalizações aplicadas com sucesso",
          });
        }
      } else {
        // Fallback para localStorage
        localStorage.setItem('serverTitle', serverTitle);
        localStorage.setItem('logoSize', logoSize.toString());
        localStorage.setItem('backgroundOpacity', backgroundOpacity.toString());
        
        toast({
          title: "Configurações salvas localmente",
          description: "Servidor indisponível, salvo apenas neste navegador",
          variant: "destructive"
        });
      }
      
      // Aplicar imediatamente
      updateTitle(serverTitle);
      
    } catch (error) {
      console.error('Erro ao salvar personalizações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-400">Configurações do Sistema</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          serverStatus === 'online' ? 'bg-green-500/20 text-green-400' :
          serverStatus === 'offline' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {serverStatus === 'online' ? 'Servidor Online' :
           serverStatus === 'offline' ? 'Servidor Indisponível' :
           'Verificando...'}
        </div>
      </div>

      {/* Seção de Personalizações */}
      <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <h4 className="text-md font-medium text-slate-300">Personalizações</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Título do Sistema</Label>
            <Input
              value={serverTitle}
              onChange={(e) => setServerTitle(e.target.value)}
              placeholder="Título exibido na aba do navegador"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-300">Tamanho do Logo (px)</Label>
            <Input
              type="number"
              value={logoSize}
              onChange={(e) => setLogoSize(parseInt(e.target.value) || 48)}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Transparência do Fundo ({Math.round(backgroundOpacity * 100)}%)</Label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={backgroundOpacity}
            onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Upload de Arquivos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Papel de Parede</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Button
                onClick={() => backgroundFile && handleFileUpload(backgroundFile, 'background')}
                disabled={!backgroundFile}
                size="sm"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Logo</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Button
                onClick={() => logoFile && handleFileUpload(logoFile, 'logo')}
                disabled={!logoFile}
                size="sm"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Favicon</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Button
                onClick={() => faviconFile && handleFileUpload(faviconFile, 'favicon')}
                disabled={!faviconFile}
                size="sm"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={saveCustomizations} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Personalizações
        </Button>
      </div>

      {/* Seção de Variáveis do Sistema */}
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

        {/* Formulário para adicionar variável */}
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

        {/* Lista de variáveis */}
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
    </div>
  );
};

export default SystemConfiguration;
