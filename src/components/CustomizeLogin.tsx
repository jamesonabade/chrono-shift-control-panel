import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { X, Download, Upload, RefreshCw } from 'lucide-react';
import { getApiEndpoint } from '@/utils/apiEndpoints';

interface CustomizeLoginProps {
  show: boolean;
  onClose: () => void;
}

const CustomizeLogin = ({ show, onClose }: CustomizeLoginProps) => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [title, setTitle] = useState('PAINEL DE CONTROLE');
  const [subtitle, setSubtitle] = useState('Sistema de Gerenciamento Docker');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (show) {
      loadCustomizations();
    }
  }, [show]);

  const loadCustomizations = async () => {
    setLoading(true);
    try {
      const customizationsUrl = getApiEndpoint('/api/customizations');
      console.log('🔄 Carregando personalizações:', customizationsUrl);
      
      const response = await fetch(customizationsUrl, {
        headers: {
          'X-User': localStorage.getItem('currentUser') || 'unknown'
        }
      });
      
      if (response.ok) {
        const customizations = await response.json();
        console.log('✅ Personalizações carregadas:', customizations);
        
        setBackgroundImage(customizations.background || '');
        setLogo(customizations.logo || '');
        setFavicon(customizations.favicon || '');
        setTitle(customizations.title || 'PAINEL DE CONTROLE');
        setSubtitle(customizations.subtitle || 'Sistema de Gerenciamento Docker');
        
        // Aplicar personalizações imediatamente
        applyCustomizations(customizations);
      } else {
        console.warn('❌ Erro ao carregar personalizações do servidor');
      }
    } catch (error) {
      console.error('❌ Erro de conexão:', error);
    } finally {
      setLoading(false);
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

    // Aplicar favicon
    if (customizations.favicon) {
      updateFavicon(customizations.favicon);
    }

    // Aplicar título da página
    document.title = customizations.title || 'PAINEL DE CONTROLE';
  };

  const saveCustomizations = async (data: any) => {
    setLoading(true);
    try {
      const customizationsUrl = getApiEndpoint('/api/customizations');
      console.log('💾 Salvando personalizações no servidor:', customizationsUrl);
      
      const response = await fetch(customizationsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User': localStorage.getItem('currentUser') || 'unknown'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('✅ Personalizações salvas no servidor');
        
        // Aplicar personalizações imediatamente
        applyCustomizations(data);

        toast({
          title: "Personalização salva!",
          description: "Alterações aplicadas globalmente",
        });
      } else {
        throw new Error('Falha ao salvar no servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar personalizações:', error);
      
      // Aplicar personalizações mesmo se o servidor falhar
      applyCustomizations(data);

      toast({
        title: "Aplicado localmente",
        description: "Servidor indisponível, configurações aplicadas apenas nesta sessão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

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
      
      if (type === 'background') {
        setBackgroundImage(result);
        await saveCustomizations({ background: result, logo, favicon, title, subtitle });
      } else if (type === 'logo') {
        setLogo(result);
        await saveCustomizations({ background: backgroundImage, logo: result, favicon, title, subtitle });
      } else if (type === 'favicon') {
        setFavicon(result);
        updateFavicon(result);
        await saveCustomizations({ background: backgroundImage, logo, favicon: result, title, subtitle });
      }
    };
    reader.readAsDataURL(file);
  };

  const updateFavicon = (faviconUrl: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    document.title = newTitle; // Aplicar imediatamente
    await saveCustomizations({ background: backgroundImage, logo, favicon, title: newTitle, subtitle });
  };

  const handleSubtitleChange = async (newSubtitle: string) => {
    setSubtitle(newSubtitle);
    await saveCustomizations({ background: backgroundImage, logo, favicon, title, subtitle: newSubtitle });
  };

  const removeImage = async (type: 'background' | 'logo' | 'favicon') => {
    if (type === 'background') {
      setBackgroundImage('');
      document.body.style.backgroundImage = '';
      await saveCustomizations({ background: '', logo, favicon, title, subtitle });
    } else if (type === 'logo') {
      setLogo('');
      await saveCustomizations({ background: backgroundImage, logo: '', favicon, title, subtitle });
    } else if (type === 'favicon') {
      setFavicon('');
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = '/favicon.ico';
      }
      await saveCustomizations({ background: backgroundImage, logo, favicon: '', title, subtitle });
    }
    
    toast({
      title: "Imagem removida!",
      description: `${type === 'background' ? 'Papel de parede' : type === 'logo' ? 'Logo' : 'Favicon'} removido`,
    });
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

  const downloadConfig = () => {
    const config = {
      background: backgroundImage,
      logo,
      favicon,
      title,
      subtitle,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sistema-personalizacao-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuração exportada!",
      description: "Arquivo de configuração baixado",
    });
  };

  return (
    <div className="absolute top-16 right-4 bg-slate-800/90 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 space-y-4 z-20 min-w-[350px] max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">Personalização Global</h3>
        <div className="flex gap-2">
          <Button
            onClick={loadCustomizations}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
            title="Recarregar configurações"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={downloadConfig}
            variant="outline"
            size="sm"
            className="border-green-500/50 text-green-400 hover:bg-green-500/20"
            title="Exportar configurações"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Papel de Parede (Global)</label>
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
                title="Baixar imagem"
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
          <div className="w-full h-20 bg-cover bg-center rounded border border-slate-600" 
               style={{ backgroundImage: `url(${backgroundImage})` }}
               title="Preview do papel de parede"
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300">Logo (Login + Dashboard)</label>
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
                title="Baixar logo"
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
          <div className="w-full h-16 flex items-center justify-center bg-slate-700/30 rounded border border-slate-600">
            <img src={logo} alt="Logo preview" className="max-h-14 max-w-full object-contain" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300">Favicon</label>
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
                title="Baixar favicon"
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

      <div className="space-y-2">
        <label className="text-sm text-slate-300">Título Principal</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="PAINEL DE CONTROLE"
          disabled={loading}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
        <p className="text-xs text-slate-500">Atual: {title}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300">Subtítulo</label>
        <Input
          type="text"
          value={subtitle}
          onChange={(e) => handleSubtitleChange(e.target.value)}
          placeholder="Sistema de Gerenciamento Docker"
          disabled={loading}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
        <p className="text-xs text-slate-500">Atual: {subtitle}</p>
      </div>

      {loading && (
        <div className="text-center text-sm text-slate-400">
          Salvando configurações...
        </div>
      )}
    </div>
  );
};

export default CustomizeLogin;
