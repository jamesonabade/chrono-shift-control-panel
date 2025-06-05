
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, FileText, Save, X } from 'lucide-react';

interface Script {
  name: string;
  content: string;
  lastModified: string;
}

const ScriptManager = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptContent, setNewScriptContent] = useState('');
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [renameValue, setRenameValue] = useState('');
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

  const loadScripts = async () => {
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/scripts`);
      if (response.ok) {
        const data = await response.json();
        setScripts(data.scripts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar scripts:', error);
      // Fallback para localStorage
      const localScripts = JSON.parse(localStorage.getItem('customScripts') || '[]');
      setScripts(localScripts);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const createScript = async () => {
    if (!newScriptName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o script",
        variant: "destructive"
      });
      return;
    }

    if (scripts.find(s => s.name === newScriptName)) {
      toast({
        title: "Nome já existe",
        description: "Já existe um script com esse nome",
        variant: "destructive"
      });
      return;
    }

    const newScript: Script = {
      name: newScriptName,
      content: newScriptContent || '#!/bin/bash\necho "Novo script"',
      lastModified: new Date().toISOString()
    };

    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/scripts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScript)
      });

      if (response.ok) {
        toast({
          title: "Script criado!",
          description: `Script "${newScriptName}" foi criado com sucesso`,
        });
        loadScripts();
      } else {
        throw new Error('Falha ao criar script no servidor');
      }
    } catch (error) {
      console.error('Erro ao criar script:', error);
      // Fallback para localStorage
      const localScripts = [...scripts, newScript];
      setScripts(localScripts);
      localStorage.setItem('customScripts', JSON.stringify(localScripts));
      
      toast({
        title: "Script criado localmente",
        description: `Script "${newScriptName}" salvo no navegador`,
      });
    }

    setNewScriptName('');
    setNewScriptContent('');
    setShowCreateDialog(false);
  };

  const renameScript = async () => {
    if (!renameValue.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um novo nome para o script",
        variant: "destructive"
      });
      return;
    }

    if (scripts.find(s => s.name === renameValue && s.name !== selectedScript)) {
      toast({
        title: "Nome já existe",
        description: "Já existe um script com esse nome",
        variant: "destructive"
      });
      return;
    }

    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/scripts/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldName: selectedScript,
          newName: renameValue
        })
      });

      if (response.ok) {
        toast({
          title: "Script renomeado!",
          description: `Script renomeado para "${renameValue}"`,
        });
        loadScripts();
      } else {
        throw new Error('Falha ao renomear script no servidor');
      }
    } catch (error) {
      console.error('Erro ao renomear script:', error);
      // Fallback para localStorage
      const updatedScripts = scripts.map(script => 
        script.name === selectedScript 
          ? { ...script, name: renameValue, lastModified: new Date().toISOString() }
          : script
      );
      setScripts(updatedScripts);
      localStorage.setItem('customScripts', JSON.stringify(updatedScripts));
      
      toast({
        title: "Script renomeado localmente",
        description: `Script renomeado para "${renameValue}"`,
      });
    }

    setRenameValue('');
    setSelectedScript('');
    setShowRenameDialog(false);
  };

  const openRenameDialog = (scriptName: string) => {
    setSelectedScript(scriptName);
    setRenameValue(scriptName);
    setShowRenameDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-purple-400">Gerenciamento de Scripts</h3>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Script
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-purple-500/30 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-purple-400">Criar Novo Script</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome do Script</Label>
                <Input
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  placeholder="exemplo-script.sh"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Conteúdo Inicial (opcional)</Label>
                <textarea
                  value={newScriptContent}
                  onChange={(e) => setNewScriptContent(e.target.value)}
                  placeholder="#!/bin/bash&#10;echo 'Novo script'"
                  rows={10}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 text-white rounded font-mono text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={createScript} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Criar Script
                </Button>
                <Button 
                  onClick={() => setShowCreateDialog(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {scripts.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Nenhum script encontrado</p>
        ) : (
          scripts.map((script, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-400" />
                <div>
                  <h4 className="text-white font-medium">{script.name}</h4>
                  <p className="text-slate-400 text-sm">
                    Modificado em: {new Date(script.lastModified).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => openRenameDialog(script.name)}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
              >
                <Edit className="w-4 h-4 mr-2" />
                Renomear
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Dialog de renomear */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-slate-800 border-purple-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-400">Renomear Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Novo Nome</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={renameScript} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Renomear
              </Button>
              <Button 
                onClick={() => setShowRenameDialog(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptManager;
