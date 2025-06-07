
import { useState } from 'react';
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
  const { toast } = useToast();

  if (!show) return null;

  const handleImageUpload = (file: File, type: 'background' | 'logo') => {
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
      } else {
        setLogo(result);
        localStorage.setItem('loginLogo', result);
      }
      
      toast({
        title: "Imagem carregada!",
        description: `${type === 'background' ? 'Papel de parede' : 'Logo'} atualizado`,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'background' | 'logo') => {
    if (type === 'background') {
      setBackgroundImage('');
      localStorage.removeItem('loginBackground');
    } else {
      setLogo('');
      localStorage.removeItem('loginLogo');
    }
    
    toast({
      title: "Imagem removida!",
      description: `${type === 'background' ? 'Papel de parede' : 'Logo'} removido`,
    });
  };

  return (
    <div className="absolute top-16 right-4 bg-slate-800/90 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 space-y-4 z-20 min-w-[300px]">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">Personalização do Login</h3>
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
        <label className="text-sm text-slate-300">Papel de Parede</label>
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
        <label className="text-sm text-slate-300">Logo</label>
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
    </div>
  );
};

export default CustomizeLogin;
