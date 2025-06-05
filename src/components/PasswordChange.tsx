
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Key, Save } from 'lucide-react';

interface PasswordChangeProps {
  username: string;
  isAdmin: boolean;
  onPasswordUpdate: (username: string, newPassword: string) => void;
}

const PasswordChange = ({ username, isAdmin, onPasswordUpdate }: PasswordChangeProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e confirmação devem ser iguais",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 4 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Verificar senha atual
    const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!isAdmin && currentUser !== username) {
      toast({
        title: "Acesso negado",
        description: "Você só pode alterar sua própria senha",
        variant: "destructive"
      });
      return;
    }

    if (credentials[username] !== currentPassword) {
      toast({
        title: "Senha atual incorreta",
        description: "A senha atual não confere",
        variant: "destructive"
      });
      return;
    }

    // Atualizar senha
    onPasswordUpdate(username, newPassword);
    
    // Limpar campos
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowDialog(false);
    
    toast({
      title: "Senha alterada!",
      description: `Senha de ${username} foi atualizada com sucesso`,
    });
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20">
          <Key className="w-4 h-4 mr-2" />
          Alterar Senha
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-blue-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-400">
            Alterar Senha - {username}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Senha Atual</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Digite a senha atual"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-300">Nova Senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Digite a nova senha"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-300">Confirmar Nova Senha</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Confirme a nova senha"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handlePasswordChange} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button 
              onClick={() => setShowDialog(false)} 
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChange;
