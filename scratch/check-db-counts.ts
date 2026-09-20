import { prisma } from "../src/lib/db/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true },
  });
  const postsCount = await prisma.post.count();
  const likesCount = await prisma.like.count();
  const commentsCount = await prisma.comment.count();
  const followsCount = await prisma.follow.count();
  const notificationsCount = await prisma.notification.count();

  console.log("=== EXISTING DATABASE STATE ===");
  console.log("Total Users:", users.length);
  console.log("Users List:", users);
  console.log("Total Posts:", postsCount);
  console.log("Total Likes:", likesCount);
  console.log("Total Comments:", commentsCount);
  console.log("Total Follows:", followsCount);
  console.log("Total Notifications:", notificationsCount);
}

main()
  .catch((e) => {
    console.error("Error checking db counts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
