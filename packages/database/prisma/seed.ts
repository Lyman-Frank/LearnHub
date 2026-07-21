import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding badges...');

  const badges = [
    {
      name: 'Первые шаги',
      description: 'Достижение за прохождение первого урока',
      iconUrl: '/achievements/first-steps.png',
      requirementType: 'COURSE_COMPLETED',
      requirementValue: 1,
    },
    {
      name: 'Непрерывный поток',
      description: 'За вход на платформу 3 дня подряд',
      iconUrl: '/achievements/streak.png',
      requirementType: 'STREAK',
      requirementValue: 3,
    },
    {
      name: 'Знаток',
      description: 'За успешное завершение 5 курсов',
      iconUrl: '/achievements/expert.png',
      requirementType: 'COURSE_COMPLETED',
      requirementValue: 5,
    },
    {
      name: 'Победитель роботов',
      description: 'За полное прохождение мини-игры "Побег робота"',
      iconUrl: '/achievements/robot.png',
      requirementType: 'MINIGAME_COMPLETED',
      requirementValue: 1,
    },
    {
      name: 'Мастер крафта',
      description: 'За успешный крафт в мини-игре "2D Майнкрафт"',
      iconUrl: '/achievements/craft.png',
      requirementType: 'MINIGAME_CRAFTING',
      requirementValue: 1,
    },
    {
      name: 'Ученик месяца',
      description: 'За занятие 1-го места в таблице лидеров',
      iconUrl: '/achievements/crown.png',
      requirementType: 'LEADERBOARD_TOP',
      requirementValue: 1,
    }
  ];

  for (const badge of badges) {
    const existing = await prisma.badge.findFirst({
      where: { name: badge.name }
    });
    if (!existing) {
      await prisma.badge.create({ data: badge });
      console.log(`Created badge: ${badge.name}`);
    } else {
      await prisma.badge.update({
        where: { id: existing.id },
        data: badge
      });
      console.log(`Updated badge: ${badge.name}`);
    }
  }

  // Delete old badges that are no longer in the list
  const badgeNames = badges.map(b => b.name);
  const deleted = await prisma.badge.deleteMany({
    where: { name: { notIn: badgeNames } }
  });
  if (deleted.count > 0) {
    console.log(`Deleted ${deleted.count} old badge(s).`);
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
