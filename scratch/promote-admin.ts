import { prisma } from "../src/lib/db/prisma";

async function promoteToAdmin() {
  const username = "vincy_jr_99";

  const updatedUser = await prisma.user.update({
    where: { username },
    data: { role: "ADMIN" },
    select: { id: true, username: true, email: true, role: true },
  });

  console.log("Successfully promoted user to ADMIN:");
  console.log(updatedUser);
}

promoteToAdmin()
  .catch((e) => {
    console.error("Error promoting user to ADMIN:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
