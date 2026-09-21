import { prisma } from "../src/lib/db/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, passwordHash: true },
  });

  console.log("=== EXISTING USER PASSWORDS / HASHES ===");
  users.forEach((u) => {
    console.log(`User: @${u.username} (${u.email})`);
    console.log(`  passwordHash: ${u.passwordHash.substring(0, 30)}... (length: ${u.passwordHash.length})`);
    console.log(`  starts with $argon2id$: ${u.passwordHash.startsWith("$argon2id$")}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
