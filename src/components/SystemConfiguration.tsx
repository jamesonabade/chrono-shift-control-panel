import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Palette, Database, Calendar, Download, Upload, Eye, EyeOff, Server, AlertTriangle, Trash } from 'lucide-react';

const SystemConfiguration = () => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [systemTitle, setSystemTitle] = useState('Painel de Controle');
  const [logoSize, setLogoSize] = useState(48);
  const [systemVariables, setSystemVariables] = useState<Record<string, string>>({});
  const [dateVariables, setDateVariables] = useState<Record<string, string>>({});
  const [databaseVariables, setDatabaseVariables] = useState<Record<string, string>>({});
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  
  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${serverUrl}/api/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
      console.error('Erro ao verificar status do servidor:', error);
    }
  };

  const loadConfigurations = async () => {
    try {
      // Tentar carregar do servidor primeiro
      const response = await fetch(`${serverUrl}/api/customizations`);
      if (response.ok) {
        const data = await response.json();
        setBackgroundImage(data.background || '');
        setLogoImage(data.logo || '');
        setSystemTitle(data.title || 'Painel de Controle');
        setLogoSize(data.logoSize || 48);
        setBackgroundOpacity(data.backgroundOpacity || 0.5);
        setServerStatus('online');
      } else {
        throw new Error('Servidor indisponível');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do servidor:', error);
      setServerStatus('offline');
      
      // Fallback para localStorage
      const savedBg = localStorage.getItem('loginBackground');
      const savedLogo = localStorage.getItem('loginLogo');
      const savedTitle = localStorage.getItem('loginTitle');
      const savedOpacity = localStorage.getItem('backgroundOpacity');
      const savedLogoSize = localStorage.getItem('logoSize');
      
      if (savedBg) setBackgroundImage(savedBg);
      if (savedLogo) setLogoImage(savedLogo);
      if (savedTitle) setSystemTitle(savedTitle);
      if (savedOpacity) setBackgroundOpacity(parseFloat(savedOpacity));
      if (savedLogoSize) setLogoSize(parseInt(savedLogoSize));
      
      // Carregar variáveis do sistema
      const savedSystemVars = localStorage.getItem('systemVariables');
      if (savedSystemVars) {
        setSystemVariables(JSON.parse(savedSystemVars));
      }

      // Carregar variáveis de data
      const savedDateVars = localStorage.getItem('dateVariables');
      if (savedDateVars) {
        setDateVariables(JSON.parse(savedDateVars));
      }

      // Carregar variáveis de banco
      const savedDatabaseVars = localStorage.getItem('databaseVariables');
      if (savedDatabaseVars) {
        setDatabaseVariables(JSON.parse(savedDatabaseVars));
      }
    }
  };

  const saveAppearanceSettings = async () => {
    const settings = {
      background: backgroundImage,
      logo: logoImage,
      title: systemTitle,
      logoSize: logoSize,
      backgroundOpacity: backgroundOpacity
    };

    try {
      // Tentar salvar no servidor primeiro
      const response = await fetch(`${serverUrl}/api/customizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Configurações salvas!",
          description: "Personalizações aplicadas com sucesso no servidor",
        });
        setServerStatus('online');
      } else {
        throw new Error(`Erro do servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao salvar no servidor:', error);
      setServerStatus('offline');
      
      // Salvar localmente como fallback
      localStorage.setItem('loginBackground', backgroundImage);
      localStorage.setItem('loginLogo', logoImage);
      localStorage.setItem('loginTitle', systemTitle);
      localStorage.setItem('logoSize', logoSize.toString());
      localStorage.setItem('backgroundOpacity', backgroundOpacity.toString());
      
      toast({
        title: "Dados salvos localmente",
        description: `Servidor indisponível (tentativa: ${serverUrl}/api/customizations), salvo apenas neste navegador`,
        variant: "destructive"
      });
    }
  };

  const downloadBackgroundImage = () => {
    if (!backgroundImage) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem de fundo configurada",
        variant: "destructive"
      });
      return;
    }

    const link = document.createElement('a');
    link.href = backgroundImage;
    link.download = 'background-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download iniciado",
      description: "Imagem de fundo baixada com sucesso",
    });
  };

  const downloadLogoImage = () => {
    if (!logoImage) {
      toast({
        title: "Erro",
        description: "Nenhum logo configurado",
        variant: "destructive"
      });
      return;
    }

    const link = document.createElement('a');
    link.href = logoImage;
    link.download = 'logo-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download iniciado",
      description: "Logo baixado com sucesso",
    });
  };

  const saveSystemVariables = () => {
    localStorage.setItem('systemVariables', JSON.stringify(systemVariables));
    toast({
      title: "Variáveis salvas!",
      description: "Variáveis do sistema atualizadas com sucesso",
    });
  };

  const addSystemVariable = (key: string, value: string) => {
    setSystemVariables(prev => ({ ...prev, [key]: value }));
  };

  const deleteSystemVariable = (key: string) => {
    const newVars = { ...systemVariables };
    delete newVars[key];
    setSystemVariables(newVars);
  };

  const saveDateVariables = () => {
    localStorage.setItem('dateVariables', JSON.stringify(dateVariables));
    toast({
      title: "Variáveis salvas!",
      description: "Variáveis de data atualizadas com sucesso",
    });
  };

  const addDateVariable = (key: string, value: string) => {
    setDateVariables(prev => ({ ...prev, [key]: value }));
  };

  const deleteDateVariable = (key: string) => {
    const newVars = { ...dateVariables };
    delete newVars[key];
    setDateVariables(newVars);
  };

  const saveDatabaseVariables = () => {
    localStorage.setItem('databaseVariables', JSON.stringify(databaseVariables));
    toast({
      title: "Variáveis salvas!",
      description: "Variáveis de banco de dados atualizadas com sucesso",
    });
  };

  const addDatabaseVariable = (key: string, value: string) => {
    setDatabaseVariables(prev => ({ ...prev, [key]: value }));
  };

  const deleteDatabaseVariable = (key: string) => {
    const newVars = { ...databaseVariables };
    delete newVars[key];
    setDatabaseVariables(newVars);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-400">Configurações do Sistema</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Server className="w-4 h-4" />
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            serverStatus === 'online' ? 'bg-green-500/20 text-green-300' :
            serverStatus === 'offline' ? 'bg-red-500/20 text-red-300' :
            'bg-yellow-500/20 text-yellow-300'
          }`}>
            {serverStatus === 'online' ? 'Online' : 
             serverStatus === 'offline' ? 'Offline' : 'Verificando...'}
          </span>
          <span className="text-slate-400 text-xs">{serverUrl}</span>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-600/30">
          <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 hover:bg-slate-700/50">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 hover:bg-slate-700/50">
            <Settings className="w-4 h-4" />
            Variáveis do Sistema
          </TabsTrigger>
          <TabsTrigger value="date" className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 hover:bg-slate-700/50">
            <Calendar className="w-4 h-4" />
            Variáveis de Data
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 hover:bg-slate-700/50">
            <Database className="w-4 h-4" />
            Variáveis de Banco
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-600/30">
            <h4 className="text-lg font-semibold text-orange-400 mb-4">Personalização Visual</h4>
            
            {serverStatus === 'offline' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">Servidor Indisponível</span>
                </div>
                <p className="text-red-200 text-sm mt-1">
                  As configurações serão salvas apenas localmente. URL tentativa: {serverUrl}/api/customizations
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-slate-300">Imagem de Fundo</Label>
                <div className="flex space-x-2">
                  <Input
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                    placeholder="URL da imagem de fundo"
                    className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  />
                  <Button 
                    onClick={downloadBackgroundImage}
                    disabled={!backgroundImage}
                    variant="outline"
                    size="sm"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                {backgroundImage && (
                  <div className="w-32 h-20 bg-cover bg-center rounded border border-slate-600" 
                       style={{ backgroundImage: `url(${backgroundImage})` }} />
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-slate-300">Transparência do Fundo</Label>
                <div className="space-y-2">
                  <Slider
                    value={[backgroundOpacity]}
                    onValueChange={(value) => setBackgroundOpacity(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Opaco (0%)</span>
                    <span className="font-medium">{Math.round(backgroundOpacity * 100)}%</span>
                    <span>Transparente (100%)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-300">Logo do Sistema</Label>
                <div className="flex space-x-2">
                  <Input
                    value={logoImage}
                    onChange={(e) => setLogoImage(e.target.value)}
                    placeholder="URL do logo"
                    className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  />
                  <Button 
                    onClick={downloadLogoImage}
                    disabled={!logoImage}
                    variant="outline"
                    size="sm"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                {logoImage && (
                  <img src={logoImage} alt="Logo" className="w-16 h-16 object-contain rounded border border-slate-600" />
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-slate-300">Tamanho do Logo (px)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[logoSize]}
                    onValueChange={(value) => setLogoSize(value[0])}
                    min={24}
                    max={200}
                    step={4}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>24px</span>
                    <span className="font-medium">{logoSize}px</span>
                    <span>200px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-300">Título do Sistema</Label>
                <Input
                  value={systemTitle}
                  onChange={(e) => setSystemTitle(e.target.value)}
                  placeholder="Título que aparece na aba do navegador"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <Button onClick={saveAppearanceSettings} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                Salvar Aparência
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-600/30">
            <h4 className="text-lg font-semibold text-blue-400 mb-4">Variáveis do Sistema</h4>
            <p className="text-slate-400 text-sm mb-4">
              Defina variáveis globais que podem ser usadas em todos os scripts e comandos.
            </p>

            <div className="space-y-4">
              {Object.entries(systemVariables).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => addSystemVariable(key, e.target.value)}
                    placeholder={`Valor para ${key}`}
                    className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  />
                  <Label className="text-slate-300">{key}</Label>
                  <Button
                    onClick={() => deleteSystemVariable(key)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  placeholder="Nome da variável"
                  className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.value) {
                      const newKey = e.target.value;
                      addSystemVariable(newKey, '');
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="Nome da variável"]');
                    if (input && input.value) {
                      const newKey = input.value;
                      addSystemVariable(newKey, '');
                      input.value = '';
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                >
                  Adicionar
                </Button>
              </div>

              <Button onClick={saveSystemVariables} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                Salvar Variáveis
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="date" className="space-y-6">
          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-600/30">
            <h4 className="text-lg font-semibold text-purple-400 mb-4">Variáveis de Data</h4>
            <p className="text-slate-400 text-sm mb-4">
              Defina variáveis de data personalizadas para usar nos seus scripts e comandos.
            </p>

            <div className="space-y-4">
              {Object.entries(dateVariables).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => addDateVariable(key, e.target.value)}
                    placeholder={`Valor para ${key}`}
                    className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  />
                  <Label className="text-slate-300">{key}</Label>
                  <Button
                    onClick={() => deleteDateVariable(key)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  placeholder="Nome da variável"
                  className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.value) {
                      const newKey = e.target.value;
                      addDateVariable(newKey, '');
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="Nome da variável"]');
                    if (input && input.value) {
                      const newKey = input.value;
                      addDateVariable(newKey, '');
                      input.value = '';
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                >
                  Adicionar
                </Button>
              </div>

              <Button onClick={saveDateVariables} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                Salvar Variáveis
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-600/30">
            <h4 className="text-lg font-semibold text-green-400 mb-4">Variáveis de Banco de Dados</h4>
            <p className="text-slate-400 text-sm mb-4">
              Configure variáveis específicas para operações de banco de dados.
            </p>

            <div className="space-y-4">
              {Object.entries(databaseVariables).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => addDatabaseVariable(key, e.target.value)}
                    placeholder={`Valor para ${key}`}
                    className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  />
                  <Label className="text-slate-300">{key}</Label>
                  <Button
                    onClick={() => deleteDatabaseVariable(key)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  placeholder="Nome da variável"
                  className="bg-slate-700/50 border-slate-600 text-white flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.value) {
                      const newKey = e.target.value;
                      addDatabaseVariable(newKey, '');
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="Nome da variável"]');
                    if (input && input.value) {
                      const newKey = input.value;
                      addDatabaseVariable(newKey, '');
                      input.value = '';
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                >
                  Adicionar
                </Button>
              </div>

              <Button onClick={saveDatabaseVariables} className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                Salvar Variáveis
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfiguration;
