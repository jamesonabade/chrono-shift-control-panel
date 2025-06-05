
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save } from 'lucide-react';

interface CustomizationsPanelProps {
  isServerAvailable: boolean;
}

export const CustomizationsPanel = ({ isServerAvailable }: CustomizationsPanelProps) => {
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [serverTitle, setServerTitle] = useState('');
  const [logoSize, setLogoSize] = useState(48);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);

  const { toast } = useToast();

  const getServerUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    const basePath = import.meta.env.VITE_BASE_PATH || '';
    return `${protocol}//${hostname}${basePath !== '/' ? basePath : ''}`;
  };

  const handleFileUpload = async (file: File, type: 'background' | 'logo' | 'favicon') => {
    if (!isServerAvailable) {
      toast({
        title: "Servidor indisponível",
        description: "Não é possível fazer upload no momento. Usando armazenamento local.",
        variant: "destructive"
      });
      
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
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/upload`, {
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
        localStorage.setItem('serverTitle', serverTitle);
        localStorage.setItem('logoSize', logoSize.toString());
        localStorage.setItem('backgroundOpacity', backgroundOpacity.toString());
        
        toast({
          title: "Configurações salvas localmente",
          description: "Servidor indisponível, salvo apenas neste navegador",
          variant: "destructive"
        });
      }
      
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

  return (
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
              disabled={!backgroundFile || !isServerAvailable}
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
              disabled={!logoFile || !isServerAvailable}
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
              disabled={!faviconFile || !isServerAvailable}
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
  );
};
