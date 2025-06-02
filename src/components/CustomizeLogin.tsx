
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface CustomizeLoginProps {
  show: boolean;
  onClose: () => void;
}

const CustomizeLogin = ({ show, onClose }: CustomizeLoginProps) => {
  const [backgroundImage, setBackgroundImage] = useState(localStorage.getItem('loginBackground') || '');
  const [logo, setLogo] = useState(localStorage.getItem('loginLogo') || '');
  const [favicon, setFavicon] = useState(localStorage.getItem('loginFavicon') || '');
  const [title, setTitle] = useState(localStorage.getItem('loginTitle') || 'PAINEL DE CONTROLE');
  const [subtitle, setSubtitle] = useState(localStorage.getItem('loginSubtitle') || 'Sistema de Gerenciamento Docker');
  const { toast } = useToast();

  useEffect(() => {
    if (show) {
      const savedBackground = localStorage.getItem('loginBackground') || '';
      const savedLogo = localStorage.getItem('loginLogo') || '';
      const savedFavicon = localStorage.getItem('loginFavicon') || '';
      const savedTitle = localStorage.getItem('loginTitle') || 'PAINEL DE CONTROLE';
      const savedSubtitle = localStorage.getItem('loginSubtitle') || 'Sistema de Gerenciamento Docker';
      
      setBackgroundImage(savedBackground);
      setLogo(savedLogo);
      setFavicon(savedFavicon);
      setTitle(savedTitle);
      setSubtitle(savedSubtitle);
    }
  }, [show]);

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
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'background') {
        setBackgroundImage(result);
        localStorage.setItem('loginBackground', result);
      } else if (type === 'logo') {
        setLogo(result);
        localStorage.setItem('loginLogo', result);
      } else if (type === 'favicon') {
        setFavicon(result);
        localStorage.setItem('loginFavicon', result);
        updateFavicon(result);
      }
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: `login${type.charAt(0).toUpperCase() + type.slice(1)}`,
        newValue: result
      }));
      
      toast({
        title: "Imagem carregada!",
        description: `${type === 'background' ? 'Papel de parede' : type === 'logo' ? 'Logo' : 'Favicon'} atualizado`,
      });
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    localStorage.setItem('loginTitle', newTitle);
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'loginTitle',
      newValue: newTitle
    }));
  };

  const handleSubtitleChange = (newSubtitle: string) => {
    setSubtitle(newSubtitle);
    localStorage.setItem('loginSubtitle', newSubtitle);
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'loginSubtitle',
      newValue: newSubtitle
    }));
  };

  const removeImage = (type: 'background' | 'logo' | 'favicon') => {
    if (type === 'background') {
      setBackgroundImage('');
      localStorage.removeItem('loginBackground');
    } else if (type === 'logo') {
      setLogo('');
      localStorage.removeItem('loginLogo');
    } else if (type === 'favicon') {
      setFavicon('');
      localStorage.removeItem('loginFavicon');
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = '/favicon.ico';
      }
    }
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: `login${type.charAt(0).toUpperCase() + type.slice(1)}`,
      newValue: null
    }));
    
    toast({
      title: "Imagem removida!",
      description: `${type === 'background' ? 'Papel de parede' : type === 'logo' ? 'Logo' : 'Favicon'} removido`,
    });
  };

  return (
    <div className="absolute top-16 right-4 bg-slate-800/90 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 space-y-4 z-20 min-w-[350px] max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">Personalização Global</h3>
        <Button
          onClick={onClose}
          variant="outline"
          size="sm"
          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
        >
          <X className="w-4 h-4" />
        </Button>
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
            <Button
              onClick={() => removeImage('background')}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
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
            <Button
              onClick={() => removeImage('logo')}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
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
            <Button
              onClick={() => removeImage('favicon')}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300">Título Principal</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="PAINEL DE CONTROLE"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300">Subtítulo</label>
        <Input
          type="text"
          value={subtitle}
          onChange={(e) => handleSubtitleChange(e.target.value)}
          placeholder="Sistema de Gerenciamento Docker"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>
    </div>
  );
};

export default CustomizeLogin;
