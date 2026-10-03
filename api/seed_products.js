const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COURSES = [
  { id: "class",     name: "Class + Notes",       price: 1499, code: "CLASS_NOTES", taxConfig: 18 },
  { id: "mock",      name: "Paid Mock Series",    price: 599,  code: "MOCK_SERIES", taxConfig: 18 },
  { id: "interview", name: "Interview Guidance",  price: 699,  code: "INTERVIEW_GUIDANCE", taxConfig: 18 }
];

async function seed() {
  for (const c of COURSES) {
    await prisma.product.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        price: c.price,
        code: c.code,
        taxConfig: c.taxConfig,
        status: "ACTIVE"
      },
      create: {
        id: c.id,
        name: c.name,
        price: c.price,
        code: c.code,
        taxConfig: c.taxConfig,
        status: "ACTIVE"
      }
    });
  }
  console.log("Products seeded!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
