
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Plus, Trash2, Palette, Download, Upload, X } from 'lucide-react';

const SystemConfiguration = () => {
  const [systemVariables, setSystemVariables] = useState({
    date: {} as Record<string, string>,
    database: {} as Record<string, string>
  });
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [activeTab, setActiveTab] = useState('variables');
  
  // Estados para personalização
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [title, setTitle] = useState('PAINEL DE CONTROLE');
  const [subtitle, setSubtitle] = useState('Sistema de Gerenciamento Docker');
  const [logoSize, setLogoSize] = useState([48]);
  const [backgroundOpacity, setBackgroundOpacity] = useState([50]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadSystemVariables();
    loadCustomizations();
  }, []);

  const loadSystemVariables = () => {
    const saved = localStorage.getItem('systemVariables');
    if (saved) {
      setSystemVariables(JSON.parse(saved));
    }
  };

  const loadCustomizations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/customizations');
      if (response.ok) {
        const customizations = await response.json();
        setBackgroundImage(customizations.background || '');
        setLogo(customizations.logo || '');
        setFavicon(customizations.favicon || '');
        setTitle(customizations.title || 'PAINEL DE CONTROLE');
        setSubtitle(customizations.subtitle || 'Sistema de Gerenciamento Docker');
        setLogoSize([customizations.logoSize || 48]);
        setBackgroundOpacity([customizations.backgroundOpacity ? customizations.backgroundOpacity * 100 : 50]);
      } else {
        // Fallback para localStorage
        const localCustomizations = {
          background: localStorage.getItem('loginBackground') || '',
          logo: localStorage.getItem('loginLogo') || '',
          favicon: localStorage.getItem('loginFavicon') || '',
          title: localStorage.getItem('loginTitle') || 'PAINEL DE CONTROLE',
          subtitle: localStorage.getItem('loginSubtitle') || 'Sistema de Gerenciamento Docker',
          logoSize: parseInt(localStorage.getItem('logoSize') || '48'),
          backgroundOpacity: parseFloat(localStorage.getItem('backgroundOpacity') || '0.5')
        };
        
        setBackgroundImage(localCustomizations.background);
        setLogo(localCustomizations.logo);
        setFavicon(localCustomizations.favicon);
        setTitle(localCustomizations.title);
        setSubtitle(localCustomizations.subtitle);
        setLogoSize([localCustomizations.logoSize]);
        setBackgroundOpacity([localCustomizations.backgroundOpacity * 100]);
      }
    } catch (error) {
      console.error('Erro ao carregar personalizações:', error);
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

  const saveCustomizations = async (data: any) => {
    const currentHost = window.location.origin;
    const apiUrl = 'http://localhost:3001/api/customizations';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar no servidor');
      }

      // Aplicar personalizações imediatamente
      applyCustomizations(data);

      // Também salvar localmente como backup
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'logoSize') {
            localStorage.setItem('logoSize', value.toString());
          } else if (key === 'backgroundOpacity') {
            localStorage.setItem('backgroundOpacity', value.toString());
          } else {
            localStorage.setItem(`login${key.charAt(0).toUpperCase() + key.slice(1)}`, value as string);
          }
        }
      });

      toast({
        title: "Personalização salva!",
        description: "Alterações aplicadas globalmente",
      });
    } catch (error) {
      console.error('Erro ao salvar personalizações:', error);
      // Fallback para localStorage
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'logoSize') {
            localStorage.setItem('logoSize', value.toString());
          } else if (key === 'backgroundOpacity') {
            localStorage.setItem('backgroundOpacity', value.toString());
          } else {
            localStorage.setItem(`login${key.charAt(0).toUpperCase() + key.slice(1)}`, value as string);
          }
        }
      });

      // Aplicar personalizações mesmo se o servidor falhar
      applyCustomizations(data);

      toast({
        title: "Dados salvos localmente",
        description: `Servidor indisponível (tentativa: ${apiUrl}), salvo apenas neste navegador`,
        variant: "destructive"
      });
    }
  };

  const applyCustomizations = (customizations: any) => {
    // Aplicar background
    if (customizations.background) {
      document.body.style.backgroundImage = `url(${customizations.background})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }

    // Aplicar overlay de transparência
    if (customizations.backgroundOpacity !== undefined) {
      const overlay = document.getElementById('dashboard-overlay');
      if (overlay) {
        overlay.style.backgroundColor = `rgba(15, 23, 42, ${1 - customizations.backgroundOpacity})`;
      }
    }

    // Aplicar favicon
    if (customizations.favicon) {
      updateFavicon(customizations.favicon);
    }

    // Aplicar título da página
    document.title = customizations.title || 'PAINEL DE CONTROLE';
  };

  const updateFavicon = (faviconUrl: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const handleImageUpload = (file: File, type: 'background' | 'logo' | 'favicon') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      
      const currentData = {
        background: backgroundImage,
        logo,
        favicon,
        title,
        subtitle,
        logoSize: logoSize[0],
        backgroundOpacity: backgroundOpacity[0] / 100
      };
      
      if (type === 'background') {
        setBackgroundImage(result);
        await saveCustomizations({ ...currentData, background: result });
      } else if (type === 'logo') {
        setLogo(result);
        await saveCustomizations({ ...currentData, logo: result });
      } else if (type === 'favicon') {
        setFavicon(result);
        updateFavicon(result);
        await saveCustomizations({ ...currentData, favicon: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = async (type: 'background' | 'logo' | 'favicon') => {
    const currentData = {
      background: backgroundImage,
      logo,
      favicon,
      title,
      subtitle,
      logoSize: logoSize[0],
      backgroundOpacity: backgroundOpacity[0] / 100
    };

    if (type === 'background') {
      setBackgroundImage('');
      document.body.style.backgroundImage = '';
      await saveCustomizations({ ...currentData, background: '' });
    } else if (type === 'logo') {
      setLogo('');
      await saveCustomizations({ ...currentData, logo: '' });
    } else if (type === 'favicon') {
      setFavicon('');
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = '/favicon.ico';
      }
      await saveCustomizations({ ...currentData, favicon: '' });
    }
  };

  const downloadImage = (imageData: string, filename: string) => {
    if (!imageData) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem para baixar",
        variant: "destructive"
      });
      return;
    }

    const link = document.createElement('a');
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download concluído!",
      description: `${filename} foi baixado`,
    });
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
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-600/30">
          <TabsTrigger value="variables" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">Variáveis do Sistema</TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Aparência</TabsTrigger>
        </TabsList>
        
        <TabsContent value="variables" className="space-y-4">
          <Tabs defaultValue="date" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger value="date" className="data-[state=active]:bg-blue-500/20">Variáveis de Data</TabsTrigger>
              <TabsTrigger value="database" className="data-[state=active]:bg-green-500/20">Variáveis de Banco</TabsTrigger>
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
        
        <TabsContent value="appearance" className="space-y-6">
          {/* Papel de Parede */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
            <h4 className="text-slate-300 mb-3 font-semibold flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Papel de Parede Global
            </h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'background');
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white text-xs"
                />
                {backgroundImage && (
                  <>
                    <Button
                      onClick={() => downloadImage(backgroundImage, 'background.png')}
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeImage('background')}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {backgroundImage && (
                <>
                  <div className="w-full h-20 bg-cover bg-center rounded border border-slate-600" 
                       style={{ backgroundImage: `url(${backgroundImage})` }}
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Transparência do Background ({backgroundOpacity[0]}%)</Label>
                    <Slider
                      value={backgroundOpacity}
                      onValueChange={(value) => {
                        setBackgroundOpacity(value);
                        const currentData = {
                          background: backgroundImage,
                          logo,
                          favicon,
                          title,
                          subtitle,
                          logoSize: logoSize[0],
                          backgroundOpacity: value[0] / 100
                        };
                        saveCustomizations(currentData);
                      }}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
            <h4 className="text-slate-300 mb-3 font-semibold">Logo do Sistema</h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo');
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white text-xs"
                />
                {logo && (
                  <>
                    <Button
                      onClick={() => downloadImage(logo, 'logo.png')}
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeImage('logo')}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {logo && (
                <>
                  <div className="w-full h-16 flex items-center justify-center bg-slate-700/30 rounded border border-slate-600">
                    <img 
                      src={logo} 
                      alt="Logo preview" 
                      className="object-contain"
                      style={{ height: `${logoSize[0]}px` }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tamanho do Logo ({logoSize[0]}px)</Label>
                    <Slider
                      value={logoSize}
                      onValueChange={(value) => {
                        setLogoSize(value);
                        const currentData = {
                          background: backgroundImage,
                          logo,
                          favicon,
                          title,
                          subtitle,
                          logoSize: value[0],
                          backgroundOpacity: backgroundOpacity[0] / 100
                        };
                        saveCustomizations(currentData);
                      }}
                      min={24}
                      max={128}
                      step={4}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Favicon */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
            <h4 className="text-slate-300 mb-3 font-semibold">Favicon</h4>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'favicon');
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white text-xs"
                />
                {favicon && (
                  <>
                    <Button
                      onClick={() => downloadImage(favicon, 'favicon.png')}
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeImage('favicon')}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              {favicon && (
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700/30 rounded border border-slate-600">
                  <img src={favicon} alt="Favicon preview" className="w-6 h-6 object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Textos */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
            <h4 className="text-slate-300 mb-3 font-semibold">Textos do Sistema</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Título Principal</Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    const currentData = {
                      background: backgroundImage,
                      logo,
                      favicon,
                      title: e.target.value,
                      subtitle,
                      logoSize: logoSize[0],
                      backgroundOpacity: backgroundOpacity[0] / 100
                    };
                    saveCustomizations(currentData);
                  }}
                  placeholder="PAINEL DE CONTROLE"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Subtítulo</Label>
                <Input
                  type="text"
                  value={subtitle}
                  onChange={(e) => {
                    setSubtitle(e.target.value);
                    const currentData = {
                      background: backgroundImage,
                      logo,
                      favicon,
                      title,
                      subtitle: e.target.value,
                      logoSize: logoSize[0],
                      backgroundOpacity: backgroundOpacity[0] / 100
                    };
                    saveCustomizations(currentData);
                  }}
                  placeholder="Sistema de Gerenciamento Docker"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfiguration;
