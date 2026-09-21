import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService } from "../src/security/passwordHashing";

async function setAdminPin() {
  const newPin = "123456";
  const passwordHash = await passwordHashingService.hashPassword(newPin);

  const updatedUser = await prisma.user.update({
    where: { username: "vincy_jr_99" },
    data: { passwordHash },
    select: { id: true, username: true, email: true, role: true },
  });

  console.log("Successfully updated admin password to 6-digit PIN:", newPin);
  console.log(updatedUser);
}

setAdminPin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
