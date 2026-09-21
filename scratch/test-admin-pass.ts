import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService } from "../src/security/passwordHashing";

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: "vincy_jr_99" },
  });

  if (!user) {
    console.log("User vincy_jr_99 not found");
    return;
  }

  console.log("Username:", user.username);
  console.log("Password Hash:", user.passwordHash);

  const commonCandidates = [
    "123456",
    "654321",
    "000000",
    "111111",
    "482915",
    "admin123",
    "admin",
    "password",
    "vincy123",
    "vincy_jr_99",
  ];

  for (const candidate of commonCandidates) {
    const isMatch = await passwordHashingService.verifyPassword(candidate, user.passwordHash);
    if (isMatch) {
      console.log(`>>> MATCH FOUND: "${candidate}" <<<`);
      return;
    }
  }

  console.log("No common candidate matched.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
