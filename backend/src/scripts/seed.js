
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuário administrador padrão
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@dashboard.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@dashboard.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Usuário administrador criado:', admin.email);

    // Criar usuário comum padrão
    const userPassword = await bcrypt.hash('user123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'user@dashboard.com' },
      update: {},
      create: {
        name: 'Usuário Comum',
        email: 'user@dashboard.com',
        password: userPassword,
        role: 'USER'
      }
    });

    console.log('✅ Usuário comum criado:', user.email);

    // Criar permissões básicas
    const permissions = [
      { name: 'VIEW_DASHBOARD', description: 'Visualizar dashboard', category: 'DASHBOARD' },
      { name: 'VIEW_LOGS', description: 'Visualizar logs', category: 'LOGS' },
      { name: 'MANAGE_USERS', description: 'Gerenciar usuários', category: 'USERS' },
      { name: 'MANAGE_CONFIG', description: 'Gerenciar configurações', category: 'CONFIG' },
      { name: 'VIEW_METRICS', description: 'Visualizar métricas', category: 'METRICS' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }

    console.log('✅ Permissões criadas');

    // Criar configurações padrão do sistema
    const configs = [
      {
        key: 'APP_NAME',
        value: 'Dashboard Sistema',
        description: 'Nome da aplicação',
        category: 'GENERAL',
        isPublic: true
      },
      {
        key: 'APP_VERSION',
        value: '1.0.0',
        description: 'Versão da aplicação',
        category: 'GENERAL',
        isPublic: true
      },
      {
        key: 'MAINTENANCE_MODE',
        value: 'false',
        description: 'Modo de manutenção',
        category: 'SYSTEM',
        isPublic: false
      },
      {
        key: 'MAX_UPLOAD_SIZE',
        value: '10',
        description: 'Tamanho máximo de upload em MB',
        category: 'FILES',
        isPublic: false
      },
      {
        key: 'SESSION_TIMEOUT',
        value: '24',
        description: 'Timeout da sessão em horas',
        category: 'SECURITY',
        isPublic: false
      }
    ];

    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {},
        create: config
      });
    }

    console.log('✅ Configurações padrão criadas');

    // Log inicial do sistema
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: 'SYSTEM_INITIALIZED',
        message: 'Sistema inicializado com dados padrão',
        details: {
          usersCreated: 2,
          permissionsCreated: permissions.length,
          configsCreated: configs.length
        }
      }
    });

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📋 Credenciais padrão:');
    console.log('   Admin: admin@dashboard.com / admin123');
    console.log('   User:  user@dashboard.com / user123');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
