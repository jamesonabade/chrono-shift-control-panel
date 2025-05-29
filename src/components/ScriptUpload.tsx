
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, Trash2 } from 'lucide-react';

interface UploadedScript {
  name: string;
  type: 'date' | 'database';
  size: number;
  uploadDate: string;
}

const ScriptUpload = () => {
  const [uploadedScripts, setUploadedScripts] = useState<UploadedScript[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUploadedScripts();
  }, []);

  const loadUploadedScripts = async () => {
    try {
      const response = await fetch('/api/scripts');
      if (response.ok) {
        const scripts = await response.json();
        setUploadedScripts(scripts);
      } else {
        // Fallback para localStorage
        const saved = localStorage.getItem('uploadedScripts');
        if (saved) {
          setUploadedScripts(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar scripts:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'date' | 'database') => {
    if (!file.name.endsWith('.sh') && !file.name.endsWith('.bash')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo .sh ou .bash",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('script', file);
      formData.append('type', type);

      const response = await fetch('/api/upload-script', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Script salvo:', result.path);
        
        // Adiciona à lista
        const newScript: UploadedScript = {
          name: file.name,
          type,
          size: file.size,
          uploadDate: new Date().toISOString()
        };
        
        const updatedScripts = [...uploadedScripts, newScript];
        setUploadedScripts(updatedScripts);
        
        // Salva no localStorage como backup
        localStorage.setItem('uploadedScripts', JSON.stringify(updatedScripts));

        toast({
          title: "Script enviado!",
          description: `${file.name} foi salvo em /app/scripts/`,
        });

      } else {
        // Fallback para localStorage apenas
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem(`${type}Script`, e.target?.result as string);
          localStorage.setItem(`${type}ScriptName`, file.name);
          
          const newScript: UploadedScript = {
            name: file.name,
            type,
            size: file.size,
            uploadDate: new Date().toISOString()
          };
          
          const updatedScripts = [...uploadedScripts, newScript];
          setUploadedScripts(updatedScripts);
          localStorage.setItem('uploadedScripts', JSON.stringify(updatedScripts));
          
          toast({
            title: "Script armazenado localmente!",
            description: `${file.name} foi armazenado no navegador`,
          });
        };
        reader.readAsText(file);
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do script",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (script: UploadedScript) => {
    try {
      const response = await fetch(`/api/download-script/${script.name}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = script.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Fallback para localStorage
        const content = localStorage.getItem(`${script.type}Script`);
        if (content) {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = script.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar o script",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (script: UploadedScript) => {
    try {
      const response = await fetch(`/api/delete-script/${script.name}`, {
        method: 'DELETE'
      });

      const updatedScripts = uploadedScripts.filter(s => s.name !== script.name);
      setUploadedScripts(updatedScripts);
      localStorage.setItem('uploadedScripts', JSON.stringify(updatedScripts));

      // Remove do localStorage também
      localStorage.removeItem(`${script.type}Script`);
      localStorage.removeItem(`${script.type}ScriptName`);

      toast({
        title: "Script removido!",
        description: `${script.name} foi removido`,
      });

    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'date');
                }}
                className="bg-slate-700/50 border-slate-600 text-white file:bg-cyan-500 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'database');
                }}
                className="bg-slate-700/50 border-slate-600 text-white file:bg-cyan-500 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
              />
              <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Scripts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-400">Scripts Enviados</h3>
        
        {uploadedScripts.length === 0 ? (
          <div className="p-6 bg-slate-700/30 rounded-lg border border-slate-600/30 text-center">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400">Nenhum script enviado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedScripts.map((script, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">{script.name}</p>
                    <p className="text-sm text-slate-400">
                      {script.type === 'date' ? 'Script de Data' : 'Script de Banco'} • 
                      {(script.size / 1024).toFixed(1)} KB • 
                      {new Date(script.uploadDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleDownload(script)}
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(script)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadedScripts.length > 0 && (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-purple-500/30">
          <p className="text-sm text-slate-300 mb-2">Scripts disponíveis no sistema:</p>
          <ul className="text-xs text-purple-400 space-y-1">
            {uploadedScripts.map((script, index) => (
              <li key={index}>• {script.name} ({script.type === 'date' ? 'Data' : 'Banco'})</li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            Localização: /app/scripts/ (dentro do container Docker)
          </p>
        </div>
      )}
    </div>
  );
};

export default ScriptUpload;
