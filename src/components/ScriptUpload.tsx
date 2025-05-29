
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

const ScriptUpload = () => {
  const [dateScript, setDateScript] = useState<File | null>(null);
  const [dbScript, setDbScript] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDateScriptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.sh') || file.name.endsWith('.bash')) {
        setDateScript(file);
        // Simula o armazenamento do script
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem('dateScript', e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo .sh ou .bash",
          variant: "destructive"
        });
      }
    }
  };

  const handleDbScriptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.sh') || file.name.endsWith('.bash')) {
        setDbScript(file);
        // Simula o armazenamento do script
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem('dbScript', e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo .sh ou .bash",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = () => {
    if (!dateScript && !dbScript) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um script",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Scripts salvos com sucesso!",
      description: "Os scripts foram armazenados e estão prontos para uso",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Script de Data */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-cyan-400">Script de Alteração de Data</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Upload do script Bash (.sh ou .bash)
            </label>
            <div className="relative">
              <Input
                type="file"
                accept=".sh,.bash"
                onChange={handleDateScriptChange}
                className="bg-slate-700/50 border-slate-600 text-white file:bg-cyan-500 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            {dateScript && (
              <p className="text-sm text-green-400">
                ✓ {dateScript.name} carregado
              </p>
            )}
          </div>
        </div>

        {/* Script de Banco */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-cyan-400">Script de Restauração de Banco</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Upload do script Bash (.sh ou .bash)
            </label>
            <div className="relative">
              <Input
                type="file"
                accept=".sh,.bash"
                onChange={handleDbScriptChange}
                className="bg-slate-700/50 border-slate-600 text-white file:bg-cyan-500 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            {dbScript && (
              <p className="text-sm text-green-400">
                ✓ {dbScript.name} carregado
              </p>
            )}
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30"
        disabled={!dateScript && !dbScript}
      >
        SALVAR SCRIPTS
      </Button>

      {(dateScript || dbScript) && (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-purple-500/30">
          <p className="text-sm text-slate-300 mb-2">Scripts carregados:</p>
          <ul className="text-xs text-purple-400 space-y-1">
            {dateScript && <li>• Script de Data: {dateScript.name}</li>}
            {dbScript && <li>• Script de Banco: {dbScript.name}</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScriptUpload;
