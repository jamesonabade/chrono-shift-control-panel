
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'USER']
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      id: 'config',
      label: 'Configurações',
      icon: Settings,
      roles: ['ADMIN']
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: FileText,
      roles: ['ADMIN']
    },
    {
      id: 'metrics',
      label: 'Métricas',
      icon: BarChart3,
      roles: ['ADMIN', 'USER']
    }
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'USER')
  );

  return (
    <div className={cn(
      "bg-slate-800 text-white transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">Menu</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-slate-700"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <nav className="px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full justify-start mb-1 text-white hover:bg-slate-700",
                isActive && "bg-slate-700",
                isCollapsed && "px-2"
              )}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};
