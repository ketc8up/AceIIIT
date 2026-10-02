const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial products into Supabase...");
  
  await prisma.product.upsert({
    where: { id: 'class' },
    update: {},
    create: {
      id: 'class',
      code: 'class',
      name: 'Class + Notes',
      description: 'FULL COURSE',
      price: 1499,
      taxConfig: 18,
      status: 'ACTIVE',
      metadata: JSON.stringify({ resourceCode: 'FULL_COURSE' })
    }
  });

  await prisma.product.upsert({
    where: { id: 'mock' },
    update: {},
    create: {
      id: 'mock',
      code: 'mock',
      name: 'Paid Mock Series',
      description: 'MOCK TESTS',
      price: 599,
      taxConfig: 18,
      status: 'ACTIVE',
      metadata: JSON.stringify({ resourceCode: 'PAID_MOCK_SERIES', grantsMockAccess: true })
    }
  });

  await prisma.product.upsert({
    where: { id: 'interview' },
    update: {},
    create: {
      id: 'interview',
      code: 'interview',
      name: 'Interview Guidance',
      description: 'INTERVIEW PREP',
      price: 699,
      taxConfig: 18,
      status: 'ACTIVE',
      metadata: JSON.stringify({ resourceCode: 'INTERVIEW_PREP' })
    }
  });

  console.log("Seeding complete! Products are ready.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
