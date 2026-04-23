import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin1234!';
  const BCRYPT_ROUNDS = 12;

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: '관리자',
      passwordHash,
      role: UserRole.admin,
      status: UserStatus.active,
    },
    update: {
      role: UserRole.admin,
    },
  });

  console.log(`Dev admin created/updated: ${admin.email} (role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
