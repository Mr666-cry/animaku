import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: 'samu' }
  });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        username: 'samu',
        password: 'samuel', // In production, this should be hashed
      }
    });
    console.log('Default admin created: samu / samuel');
  } else {
    console.log('Admin already exists');
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
