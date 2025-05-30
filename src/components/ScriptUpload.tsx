import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, Trash2, Play, Eye } from 'lucide-react';

interface UploadedScript {
  name: string;
  type: 'date' | 'database';
  size: number;
  uploadDate: string;
}

const ScriptUpload = () => {
  const [uploadedScripts, setUploadedScripts] = useState<UploadedScript[]>([]);
  const [previewContent, setPreviewContent] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUploadedScripts();
  }, []);

  const loadUploadedScripts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scripts');
      if (response.ok) {
        const scripts = await response.json();
        setUploadedScripts(scripts);
      }
    } catch (error) {
      console.error('Erro ao carregar scripts:', error);
      // Fallback para localStorage
      const saved = localStorage.getItem('uploadedScripts');
      if (saved) {
        setUploadedScripts(JSON.parse(saved));
      }
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

      const response = await fetch('http://localhost:3001/api/upload-script', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Script salvo no servidor:', result.path);
        
        toast({
          title: "Script enviado!",
          description: `${file.name} foi salvo em /app/scripts/`,
        });

        // Recarrega a lista
        await loadUploadedScripts();
      } else {
        throw new Error('Falha no upload do script');
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
      const response = await fetch(`http://localhost:3001/api/download-script/${script.name}`);
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
        
        toast({
          title: "Download concluído!",
          description: `${script.name} foi baixado`,
        });
      } else {
        throw new Error('Falha no download');
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
      const response = await fetch(`http://localhost:3001/api/delete-script/${script.name}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Script removido!",
          description: `${script.name} foi removido`,
        });

        // Recarrega a lista
        await loadUploadedScripts();
      } else {
        throw new Error('Falha ao deletar script');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover script",
        variant: "destructive"
      });
    }
  };

  const handleExecute = async (script: UploadedScript) => {
    try {
      const response = await fetch('http://localhost:3001/api/execute-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptName: script.name,
          environment: {}
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Script executado!",
          description: `${script.name} foi executado com sucesso`,
        });
      } else {
        toast({
          title: "Erro na execução",
          description: `Falha ao executar ${script.name}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na execução:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar script",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async (script: UploadedScript) => {
    try {
      const response = await fetch(`http://localhost:3001/api/preview-script/${script.name}`);
      if (response.ok) {
        const result = await response.json();
        setPreviewContent(result.content);
        setPreviewFileName(result.fileName);
        setShowPreview(true);
        
        toast({
          title: "Preview carregado!",
          description: `Conteúdo de ${script.name} carregado`,
        });
      } else {
        throw new Error('Falha ao carregar preview');
      }
    } catch (error) {
      console.error('Erro no preview:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar preview do script",
        variant: "destructive"
      });
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-purple-400">Scripts Enviados</h3>
          <Button
            onClick={loadUploadedScripts}
            variant="outline"
            size="sm"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
          >
            Atualizar Lista
          </Button>
        </div>
        
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
                    onClick={() => handleExecute(script)}
                    variant="outline"
                    size="sm"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                    title="Executar Script"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handlePreview(script)}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                    title="Visualizar Script"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDownload(script)}
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                    title="Baixar Script"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(script)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    title="Remover Script"
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

      {/* Dialog para preview do script */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Preview: {previewFileName}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full rounded-md border border-slate-600/30 p-4">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded">
              {previewContent}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptUpload;
