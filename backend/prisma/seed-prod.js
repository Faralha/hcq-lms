/* eslint-disable */
const { PrismaClient, Role } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const adminPassword = 'PROD_ADMIN_PASSWORD_REMOVED';

async function main() {
  console.log('🌱 Seeding production database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@hcq.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', existingAdmin.email);
    console.log('⏭️  Skipping admin creation');
  } else {
    // Create Admin User with secure password
    const adminPasswordHashed = await argon2.hash(adminPassword);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hcq.com',
        password: adminPasswordHashed,
        nama: 'Administrator',
        role: Role.ADMIN,
      },
    });

    console.log('✅ Production admin created:', admin.email);
  }

  console.log('🎉 Production seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Production seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
