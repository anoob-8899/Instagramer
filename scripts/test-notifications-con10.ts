import { prisma } from "../src/lib/db/prisma";
import { notificationService } from "../src/lib/notifications/notificationService";
import { NotificationType } from "@prisma/client";

async function runNotificationsTestSuite() {
  console.log("=================================================");
  console.log("CON 10: NOTIFICATIONS & ACTIVITY SYSTEM TEST SUITE");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const testSuffix = `con10_${Date.now()}`;
  const userA_username = `notif_alice_${testSuffix}`;
  const userB_username = `notif_bob_${testSuffix}`;
  const userC_username = `notif_charlie_${testSuffix}`;

  let userA: any = null;
  let userB: any = null;
  let userC: any = null;
  let postA: any = null;
  let commentA: any = null;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Create isolated test users and content
    // ------------------------------------------------------------------------
    console.log("\n--- SETUP: Isolated Test Entities ---");

    userA = await prisma.user.create({
      data: {
        username: userA_username,
        email: `${userA_username}@example.com`,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehashalice",
        profile: {
          create: {
            displayName: "Alice Notifications",
          },
        },
      },
    });

    userB = await prisma.user.create({
      data: {
        username: userB_username,
        email: `${userB_username}@example.com`,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehashbob",
        profile: {
          create: {
            displayName: "Bob Notifications",
          },
        },
      },
    });

    userC = await prisma.user.create({
      data: {
        username: userC_username,
        email: `${userC_username}@example.com`,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehashcharlie",
      },
    });

    postA = await prisma.post.create({
      data: {
        authorId: userA.id,
        caption: "Alice's test post for notifications",
        mediaUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      },
    });

    assert(Boolean(userA && userB && userC && postA), "Test users and post created successfully");

    // ------------------------------------------------------------------------
    // TEST 1: Database Model & Prisma Schema
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 1: Database Schema & Relations ---");
    const initialCount = await prisma.notification.count({
      where: { recipientId: userA.id },
    });
    assert(initialCount === 0, "Initial unread notification count is 0 for test user");

    // ------------------------------------------------------------------------
    // TEST 2: Self-Action Prevention
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 2: Self-Notification Prevention ---");

    // Alice likes Alice's own post
    const selfLikeNotif = await notificationService.createLikeNotification({
      actorId: userA.id,
      postId: postA.id,
    });
    assert(selfLikeNotif === null, "Self-like does NOT generate notification");

    // Alice comments on Alice's own post
    const selfComment = await prisma.comment.create({
      data: {
        authorId: userA.id,
        postId: postA.id,
        content: "Self comment from Alice",
      },
    });
    const selfCommentNotif = await notificationService.createCommentNotification({
      actorId: userA.id,
      postId: postA.id,
      commentId: selfComment.id,
    });
    assert(selfCommentNotif === null, "Self-comment does NOT generate notification");

    // Alice follows Alice
    const selfFollowNotif = await notificationService.createFollowNotification({
      actorId: userA.id,
      followingId: userA.id,
    });
    assert(selfFollowNotif === null, "Self-follow does NOT generate notification");

    const afterSelfCount = await notificationService.getUnreadCount(userA.id);
    assert(afterSelfCount === 0, "Unread count remains 0 after self-actions");

    // ------------------------------------------------------------------------
    // TEST 3: Social Triggers (Like, Comment, Follow)
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 3: Social Activity Notifications ---");

    // Bob likes Alice's post
    const bobLike = await notificationService.createLikeNotification({
      actorId: userB.id,
      postId: postA.id,
    });
    assert(bobLike !== null && bobLike.type === "LIKE", "Bob liking Alice's post creates LIKE notification");
    assert(bobLike?.recipientId === userA.id, "Recipient is post owner (Alice)");
    assert(bobLike?.actorId === userB.id, "Actor is liker (Bob)");

    // Deduplication check: Bob liking again refreshes timestamp without creating duplicate row
    const bobLikeDup = await notificationService.createLikeNotification({
      actorId: userB.id,
      postId: postA.id,
    });
    assert(bobLikeDup !== null && bobLikeDup.id === bobLike?.id, "Duplicate like notification updates existing unread record");

    // Bob comments on Alice's post
    commentA = await prisma.comment.create({
      data: {
        authorId: userB.id,
        postId: postA.id,
        content: "Nice photo Alice!",
      },
    });
    const bobCommentNotif = await notificationService.createCommentNotification({
      actorId: userB.id,
      postId: postA.id,
      commentId: commentA.id,
    });
    assert(bobCommentNotif !== null && bobCommentNotif.type === "COMMENT", "Bob commenting on Alice's post creates COMMENT notification");
    assert(bobCommentNotif?.commentId === commentA.id, "Comment notification links to comment entity");

    // Charlie follows Alice
    const charlieFollowNotif = await notificationService.createFollowNotification({
      actorId: userC.id,
      followingId: userA.id,
    });
    assert(charlieFollowNotif !== null && charlieFollowNotif.type === "FOLLOW", "Charlie following Alice creates FOLLOW notification");

    // ------------------------------------------------------------------------
    // TEST 4: E2EE Messaging Privacy Boundary
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 4: Messaging Notifications & E2EE Privacy Boundary ---");

    // Bob sends a message to Alice
    const messageNotif = await notificationService.createMessageNotification({
      senderId: userB.id,
      recipientId: userA.id,
    });
    assert(messageNotif !== null && messageNotif.type === "MESSAGE", "Message creates MESSAGE notification");
    assert(messageNotif?.recipientId === userA.id, "Recipient is target user");

    // Verify Notification model has no plaintext/ciphertext leakage
    const notifKeys = Object.keys(messageNotif || {});
    assert(!notifKeys.includes("plaintext"), "Notification contains no 'plaintext' field");
    assert(!notifKeys.includes("ciphertext"), "Notification contains no 'ciphertext' field");
    assert(!notifKeys.includes("privateKey"), "Notification contains no 'privateKey' field");
    assert(!notifKeys.includes("decryptedContent"), "Notification contains no 'decryptedContent' field");

    // ------------------------------------------------------------------------
    // TEST 5: Retrieval, Formatting & Pagination
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 5: Retrieval, DTO Formatting & Unread Count ---");

    const unreadCountA = await notificationService.getUnreadCount(userA.id);
    assert(unreadCountA === 4, `Unread count is exactly 4 (got ${unreadCountA})`);

    const userANotifs = await notificationService.getUserNotifications({
      userId: userA.id,
      limit: 10,
    });
    assert(userANotifs.notifications.length === 4, `Fetched 4 notifications for Alice`);
    assert(userANotifs.notifications[0].actor.username === userB_username || userANotifs.notifications[0].actor.username === userC_username, "Actor details populated from profile relations");

    const commentItem = userANotifs.notifications.find((n) => n.type === "COMMENT");
    assert(Boolean(commentItem && commentItem.comment?.content === "Nice photo Alice!"), "Comment notification includes comment content preview");

    // ------------------------------------------------------------------------
    // TEST 6: Authorization & Isolation (Cross-user Access Protection)
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 6: Authorization & Isolation ---");

    // Bob tries to read Alice's notifications
    const userBNotifs = await notificationService.getUserNotifications({
      userId: userB.id,
    });
    assert(userBNotifs.notifications.length === 0, "Bob cannot see Alice's notifications (returns 0 for Bob)");

    // Bob tries to mark Alice's notification as read
    const markOther = await notificationService.markAsRead({
      notificationId: bobLike!.id,
      userId: userB.id,
    });
    assert(markOther === null, "Bob cannot mark Alice's notification as read (returns null)");

    // Alice marks single notification as read
    const markAlice = await notificationService.markAsRead({
      notificationId: bobLike!.id,
      userId: userA.id,
    });
    assert(markAlice !== null && markAlice.readAt !== null, "Alice can mark own notification as read");

    const afterOneReadCount = await notificationService.getUnreadCount(userA.id);
    assert(afterOneReadCount === 3, `Unread count decremented to 3 (got ${afterOneReadCount})`);

    // Alice marks all as read
    const markAllResult = await notificationService.markAllAsRead(userA.id);
    assert(markAllResult.count === 3, `Mark all read updated remaining 3 notifications`);

    const finalUnreadCount = await notificationService.getUnreadCount(userA.id);
    assert(finalUnreadCount === 0, "Unread count is 0 after markAllAsRead");

    // ------------------------------------------------------------------------
    // TEST 7: Referential Integrity & Cascade Deletion
    // ------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 7: Cascade Deletes & Content Handling ---");

    // Delete postA -> should cascade delete associated notifications
    await prisma.post.delete({
      where: { id: postA.id },
    });

    const notifsAfterPostDelete = await notificationService.getUserNotifications({
      userId: userA.id,
    });
    // Follow and Message notifications should remain, Post/Comment notifications cascaded
    assert(notifsAfterPostDelete.notifications.length === 2, "Cascade deletion cleaned up deleted post notifications");

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP: Clean up test users and data
    // ------------------------------------------------------------------------
    console.log("\n--- CLEANUP ---");
    if (userA?.id) {
      await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB?.id) {
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
    if (userC?.id) {
      await prisma.user.delete({ where: { id: userC.id } }).catch(() => {});
    }
    console.log("Cleaned up isolated test records.");
  }

  console.log("\n=================================================");
  console.log(`CON 10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runNotificationsTestSuite().catch((err) => {
  console.error("Fatal error in test suite:", err);
  process.exit(1);
});
