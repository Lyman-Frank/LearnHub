const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');
const path = require('path');

// База данных находится по пути: packages/database/prisma/dev.db
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(__dirname, 'packages/database/prisma/dev.db')}`
    }
  }
});

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Использование:');
    console.log('  node manage_users.js --list              - Показать список всех пользователей');
    console.log('  node manage_users.js --promote <email>   - Назначить роль ADMIN пользователю');
    console.log('  node manage_users.js --role <email> <role> - Назначить любую роль (STUDENT, TEACHER, ADMIN)');
    return;
  }

  if (args[0] === '--list') {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      }
    });

    console.log('\nСписок зарегистрированных пользователей:');
    if (users.length === 0) {
      console.log('Нет зарегистрированных пользователей.');
    } else {
      console.table(users);
    }
  } else if (args[0] === '--promote') {
    const email = args[1];
    if (!email) {
      console.error('Ошибка: Укажите email пользователя.');
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });
      console.log(`\nПользователь ${user.email} (${user.firstName} ${user.lastName}) успешно повышен до ADMIN!`);
    } catch (e) {
      console.error('Ошибка: Пользователь с таким email не найден.', e.message);
    }
  } else if (args[0] === '--role') {
    const email = args[1];
    const role = args[2];
    if (!email || !role) {
      console.error('Ошибка: Укажите email и роль (STUDENT, TEACHER, ADMIN).');
      return;
    }

    const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      console.error(`Ошибка: Некорректная роль. Доступные роли: ${validRoles.join(', ')}`);
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { email },
        data: { role }
      });
      console.log(`\nРоль пользователя ${user.email} изменена на ${user.role}!`);
    } catch (e) {
      console.error('Ошибка:', e.message);
    }
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
