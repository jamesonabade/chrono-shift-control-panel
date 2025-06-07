
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logApi, userApi, configApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Users, Settings, FileText, Activity } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalConfigs: number;
  totalLogs: number;
  recentActivity: number;
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConfigs: 0,
    totalLogs: 0,
    recentActivity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      if (user?.role === 'ADMIN') {
        const [usersResponse, configsResponse, logsResponse] = await Promise.all([
          userApi.getUsers({ limit: 1 }),
          configApi.getConfigs(),
          logApi.getLogs({ limit: 1 })
        ]);

        setStats({
          totalUsers: usersResponse.data.data?.pagination?.total || 0,
          totalConfigs: configsResponse.data.data?.configs?.length || 0,
          totalLogs: logsResponse.data.data?.pagination?.total || 0,
          recentActivity: 0 // Implementar depois
        });
      } else {
        // Para usuários comuns, mostrar apenas estatísticas públicas
        const configsResponse = await configApi.getConfigs({ isPublic: true });
        setStats({
          totalUsers: 0,
          totalConfigs: configsResponse.data.data?.configs?.length || 0,
          totalLogs: 0,
          recentActivity: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      visible: user?.role === 'ADMIN'
    },
    {
      title: 'Configurações',
      value: stats.totalConfigs,
      icon: Settings,
      color: 'text-green-500',
      visible: true
    },
    {
      title: 'Logs do Sistema',
      value: stats.totalLogs,
      icon: FileText,
      color: 'text-yellow-500',
      visible: user?.role === 'ADMIN'
    },
    {
      title: 'Atividade Recente',
      value: stats.recentActivity,
      icon: Activity,
      color: 'text-purple-500',
      visible: true
    }
  ].filter(card => card.visible);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
