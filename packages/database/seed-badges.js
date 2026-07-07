const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding badges...');

  const badges = [
    {
      name: 'Первые шаги',
      description: 'Завершите 1 шаг на платформе.',
      iconUrl: '/badges/first_step.png',
      requirementType: 'STEPS_COMPLETED',
      requirementValue: 1,
    },
    {
      name: 'Ученик',
      description: 'Завершите 10 шагов.',
      iconUrl: '/badges/10_steps.png',
      requirementType: 'STEPS_COMPLETED',
      requirementValue: 10,
    },
    {
      name: 'Первая кровь',
      description: 'Получите 100 XP.',
      iconUrl: '/badges/first_blood.png',
      requirementType: 'XP_EARNED',
      requirementValue: 100,
    },
    {
      name: 'Огонек',
      description: 'Поддерживайте стрик 3 дня подряд.',
      iconUrl: '/badges/streak_3.png',
      requirementType: 'STREAK',
      requirementValue: 3,
    },
    {
      name: 'Выпускник',
      description: 'Успешно завершите свой первый курс.',
      iconUrl: '/badges/graduate.png',
      requirementType: 'COURSE_COMPLETED',
      requirementValue: 1,
    },
  ];

  for (const badge of badges) {
    const existing = await prisma.badge.findFirst({
      where: { name: badge.name }
    });
    if (!existing) {
      await prisma.badge.create({ data: badge });
      console.log(`Created badge: ${badge.name}`);
    } else {
      console.log(`Badge ${badge.name} already exists.`);
    }
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
