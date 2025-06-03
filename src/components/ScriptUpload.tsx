import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, Trash2, Eye, Calendar, Database, Terminal } from 'lucide-react';

interface UploadedScript {
  name: string;
  type: 'date' | 'database' | 'custom';
  size: number;
  uploadDate: string;
}

const ScriptUpload = () => {
  const [uploadedScripts, setUploadedScripts] = useState<UploadedScript[]>([]);
  const [previewContent, setPreviewContent] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedType, setSelectedType] = useState<'date' | 'database' | 'custom'>('custom');
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
      toast({
        title: "Erro de conexão",
        description: `Não foi possível conectar ao servidor (http://localhost:3001/api/scripts)`,
        variant: "destructive"
      });
    }
  };

  const handleMultipleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um arquivo",
        variant: "destructive"
      });
      return;
    }

    const results = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      if (!file.name.endsWith('.sh') && !file.name.endsWith('.bash')) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é um arquivo .sh ou .bash`,
          variant: "destructive"
        });
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('script', file);
        formData.append('type', selectedType);

        const response = await fetch('http://localhost:3001/api/upload-script', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          results.push({ success: true, fileName: file.name });
        } else {
          results.push({ success: false, fileName: file.name, error: 'Falha no upload' });
        }
      } catch (error) {
        results.push({ success: false, fileName: file.name, error: error instanceof Error ? error.message : 'Erro desconhecido' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast({
        title: `${successCount} script(s) enviado(s)!`,
        description: failCount > 0 ? `${failCount} arquivo(s) falharam` : "Todos os scripts foram enviados com sucesso",
      });
      await loadUploadedScripts();
    }

    if (failCount > 0) {
      const failedFiles = results.filter(r => !r.success).map(r => r.fileName).join(', ');
      toast({
        title: "Alguns uploads falharam",
        description: `Arquivos com erro: ${failedFiles}`,
        variant: "destructive"
      });
    }

    // Limpar seleção
    setSelectedFiles(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFileUpload = async (file: File, type: 'date' | 'database' | 'custom') => {
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

  const handleEdit = async (script: UploadedScript) => {
    try {
      const response = await fetch(`http://localhost:3001/api/preview-script/${script.name}`);
      if (response.ok) {
        const result = await response.json();
        setEditContent(result.content);
        setEditFileName(result.fileName);
        setShowEdit(true);
      } else {
        throw new Error('Falha ao carregar script para edição');
      }
    } catch (error) {
      console.error('Erro ao abrir editor:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir editor do script",
        variant: "destructive"
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const blob = new Blob([editContent], { type: 'text/plain' });
      const file = new File([blob], editFileName, { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('script', file);
      formData.append('type', editFileName.toLowerCase().includes('date') || editFileName.toLowerCase().includes('data') ? 'date' : 'database');

      const response = await fetch('http://localhost:3001/api/upload-script', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Script salvo!",
          description: `${editFileName} foi atualizado com sucesso`,
        });
        setShowEdit(false);
        await loadUploadedScripts();
      } else {
        throw new Error('Falha ao salvar script');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações do script",
        variant: "destructive"
      });
    }
  };

  const getScriptIcon = (type: string) => {
    switch (type) {
      case 'date': return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'database': return <Database className="w-5 h-5 text-green-400" />;
      default: return <Terminal className="w-5 h-5 text-purple-400" />;
    }
  };

  const getScriptTypeLabel = (type: string) => {
    switch (type) {
      case 'date': return 'Alteração de Data';
      case 'database': return 'Restauração de Banco';
      default: return 'Script Personalizado';
    }
  };

  const getScriptTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'date': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'database': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-cyan-400">Upload de Scripts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Tipo do Script
            </label>
            <Select value={selectedType} onValueChange={(value: 'date' | 'database' | 'custom') => setSelectedType(value)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="custom" className="text-white">Script Personalizado</SelectItem>
                <SelectItem value="date" className="text-white">Alteração de Data</SelectItem>
                <SelectItem value="database" className="text-white">Restauração de Banco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Arquivos (.sh ou .bash)
            </label>
            <Input
              type="file"
              accept=".sh,.bash"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="bg-slate-700/50 border-slate-600 text-white file:bg-cyan-500 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Ação
            </label>
            <Button 
              onClick={handleMultipleFileUpload}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
              disabled={!selectedFiles || selectedFiles.length === 0}
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar {selectedFiles ? selectedFiles.length : 0} Arquivo(s)
            </Button>
          </div>
        </div>

        {selectedFiles && selectedFiles.length > 0 && (
          <div className="p-3 bg-slate-700/30 rounded-lg border border-cyan-500/30">
            <p className="text-sm text-slate-300 mb-2">Arquivos selecionados:</p>
            <div className="space-y-1">
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} className="text-xs text-cyan-400 flex items-center">
                  <FileText className="w-3 h-3 mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          </div>
        )}
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
                  {getScriptIcon(script.type)}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white font-medium">{script.name}</p>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getScriptTypeBadgeColor(script.type)}`}>
                        {getScriptTypeLabel(script.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
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
                    onClick={() => handleEdit(script)}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                    title="Editar Script"
                  >
                    <Edit className="w-4 h-4" />
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
              <li key={index} className="flex items-center space-x-2">
                {getScriptIcon(script.type)}
                <span>• {script.name} ({getScriptTypeLabel(script.type)})</span>
              </li>
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

      {/* Dialog para edição do script */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-slate-800 border-yellow-500/30">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center justify-between">
              <div className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Editando: {editFileName}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  onClick={() => setShowEdit(false)}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] w-full">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="h-full w-full bg-slate-900/50 border-slate-600/30 text-slate-300 font-mono text-sm resize-none"
              placeholder="Conteúdo do script..."
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptUpload;
