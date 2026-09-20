import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService } from "../src/security/passwordHashing";
import { notificationService } from "../src/lib/notifications/notificationService";

export const DEMO_USERS_CONFIG = [
  {
    username: "maya.visuals",
    email: "maya.visuals@demo.instagramer.internal",
    displayName: "Maya Thomas",
    bio: "Visual storyteller • Photography • Kerala",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    plainPassword: "Maya@Demo2026!Visuals",
    posts: [
      {
        caption: "Chasing the last light before the rain. The mist over Western Ghats is unmatched.",
        mediaUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1080&auto=format&fit=crop&q=80",
      },
      {
        caption: "Golden hour glow capturing quiet moments by the Kerala backwaters.",
        mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80",
      },
      {
        caption: "Gear prepped for tomorrow's outdoor shoot. Standard prime lens is all you need.",
        mediaUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1080&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    username: "alex.frames",
    email: "alex.frames@demo.instagramer.internal",
    displayName: "Alex Joseph",
    bio: "Frames, films & late-night edits 🎬",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    plainPassword: "Alex@Demo2026!Frames",
    posts: [
      {
        caption: "Some frames only make sense after midnight. Color grading session in progress.",
        mediaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&auto=format&fit=crop&q=80",
      },
      {
        caption: "Neon reflections and quiet city streets. Night shooting hits different.",
        mediaUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1080&auto=format&fit=crop&q=80",
      },
      {
        caption: "Behind the scenes framing up the final shot of our documentary short.",
        mediaUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1080&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    username: "nina.creates",
    email: "nina.creates@demo.instagramer.internal",
    displayName: "Nina George",
    bio: "Designing little things that matter ✦",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    plainPassword: "Nina@Demo2026!Creates",
    posts: [
      {
        caption: "Building ideas one pixel at a time. Clean layouts, clear typography.",
        mediaUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1080&auto=format&fit=crop&q=80",
      },
      {
        caption: "Exploring negative space and modern type contrast.",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    username: "ryan.travels",
    email: "ryan.travels@demo.instagramer.internal",
    displayName: "Ryan Mathew",
    bio: "Finding new places and documenting the journey 🌍",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    plainPassword: "Ryan@Demo2026!Travels",
    posts: [
      {
        caption: "Another road, another story. Wandering through mountain trails.",
        mediaUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1080&auto=format&fit=crop&q=80",
      },
      {
        caption: "Spontaneous street moments caught in between destinations.",
        mediaUrl: "https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?w=1080&auto=format&fit=crop&q=80",
      },
    ],
  },
];

export async function seedDemoData() {
  console.log("Starting synthetic demo seeding process...");

  // 1. Seed Demo Users & Profiles
  const userMap = new Map<string, { id: string; username: string }>();

  for (const config of DEMO_USERS_CONFIG) {
    let user = await prisma.user.findUnique({
      where: { username: config.username },
      include: { profile: true },
    });

    if (!user) {
      console.log(`Creating demo user @${config.username}...`);
      const passwordHash = await passwordHashingService.hashPassword(config.plainPassword);
      user = await prisma.user.create({
        data: {
          username: config.username,
          email: config.email,
          passwordHash,
          role: "USER",
          status: "ACTIVE",
          profile: {
            create: {
              displayName: config.displayName,
              bio: config.bio,
              avatarUrl: config.avatarUrl,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      console.log(`Demo user @${config.username} already exists. Skipping user creation.`);
    }

    userMap.set(config.username, { id: user.id, username: user.username });
  }

  // 2. Seed Posts
  const postMap = new Map<string, string>(); // key: `${username}_${index}`, value: postId

  for (const config of DEMO_USERS_CONFIG) {
    const author = userMap.get(config.username)!;
    for (let idx = 0; idx < config.posts.length; idx++) {
      const postSpec = config.posts[idx];
      let post = await prisma.post.findFirst({
        where: {
          authorId: author.id,
          caption: postSpec.caption,
        },
      });

      if (!post) {
        console.log(`Creating post ${idx + 1} for @${author.username}...`);
        post = await prisma.post.create({
          data: {
            authorId: author.id,
            caption: postSpec.caption,
            mediaUrl: postSpec.mediaUrl,
          },
        });
      } else {
        console.log(`Post ${idx + 1} for @${author.username} already exists. Skipping.`);
      }

      postMap.set(`${config.username}_${idx}`, post.id);
    }
  }

  // 3. Seed Follows
  const followRelations = [
    { follower: "maya.visuals", following: "alex.frames" },
    { follower: "maya.visuals", following: "nina.creates" },
    { follower: "alex.frames", following: "maya.visuals" },
    { follower: "alex.frames", following: "ryan.travels" },
    { follower: "nina.creates", following: "maya.visuals" },
    { follower: "nina.creates", following: "alex.frames" },
    { follower: "nina.creates", following: "ryan.travels" },
    { follower: "ryan.travels", following: "maya.visuals" },
    { follower: "ryan.travels", following: "nina.creates" },
  ];

  for (const rel of followRelations) {
    const follower = userMap.get(rel.follower)!;
    const following = userMap.get(rel.following)!;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: following.id,
        },
      },
    });

    if (!existingFollow) {
      console.log(`Creating follow relationship: @${rel.follower} -> @${rel.following}`);
      await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: following.id,
        },
      });

      await notificationService.createFollowNotification({
        actorId: follower.id,
        followingId: following.id,
      });
    }
  }

  // 4. Seed Likes
  const likeMatrix = [
    // Maya likes Alex 0, 1; Nina 0, 1; Ryan 0, 1
    { username: "maya.visuals", targetUser: "alex.frames", postIndices: [0, 1] },
    { username: "maya.visuals", targetUser: "nina.creates", postIndices: [0, 1] },
    { username: "maya.visuals", targetUser: "ryan.travels", postIndices: [0, 1] },
    // Alex likes Maya 0, 1; Nina 0; Ryan 0, 1
    { username: "alex.frames", targetUser: "maya.visuals", postIndices: [0, 1] },
    { username: "alex.frames", targetUser: "nina.creates", postIndices: [0] },
    { username: "alex.frames", targetUser: "ryan.travels", postIndices: [0, 1] },
    // Nina likes Maya 0, 2; Alex 0, 2; Ryan 0
    { username: "nina.creates", targetUser: "maya.visuals", postIndices: [0, 2] },
    { username: "nina.creates", targetUser: "alex.frames", postIndices: [0, 2] },
    { username: "nina.creates", targetUser: "ryan.travels", postIndices: [0] },
    // Ryan likes Maya 0, 1; Alex 0; Nina 0, 1
    { username: "ryan.travels", targetUser: "maya.visuals", postIndices: [0, 1] },
    { username: "ryan.travels", targetUser: "alex.frames", postIndices: [0] },
    { username: "ryan.travels", targetUser: "nina.creates", postIndices: [0, 1] },
  ];

  for (const item of likeMatrix) {
    const user = userMap.get(item.username)!;
    for (const postIdx of item.postIndices) {
      const postId = postMap.get(`${item.targetUser}_${postIdx}`);
      if (!postId) continue;

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });

      if (!existingLike) {
        await prisma.like.create({
          data: {
            userId: user.id,
            postId,
          },
        });

        await notificationService.createLikeNotification({
          actorId: user.id,
          postId,
        });
      }
    }
  }

  // 5. Seed Comments
  const commentsConfig = [
    { author: "alex.frames", targetUser: "maya.visuals", postIdx: 0, text: "That light is incredible." },
    { author: "nina.creates", targetUser: "maya.visuals", postIdx: 0, text: "Love the composition." },
    { author: "ryan.travels", targetUser: "maya.visuals", postIdx: 1, text: "Where is this location?" },
    { author: "alex.frames", targetUser: "maya.visuals", postIdx: 2, text: "Prime lenses never disappoint!" },

    { author: "maya.visuals", targetUser: "alex.frames", postIdx: 0, text: "This looks cinematic." },
    { author: "nina.creates", targetUser: "alex.frames", postIdx: 0, text: "Great color grading!" },
    { author: "ryan.travels", targetUser: "alex.frames", postIdx: 1, text: "Night shots are awesome." },
    { author: "maya.visuals", targetUser: "alex.frames", postIdx: 2, text: "Hyped to see the final cut!" },

    { author: "maya.visuals", targetUser: "nina.creates", postIdx: 0, text: "Clean and elegant workspace." },
    { author: "ryan.travels", targetUser: "nina.creates", postIdx: 0, text: "Building ideas one pixel at a time!" },
    { author: "alex.frames", targetUser: "nina.creates", postIdx: 1, text: "Absolutely beautiful frame." },

    { author: "nina.creates", targetUser: "ryan.travels", postIdx: 0, text: "Such a peaceful trail view." },
    { author: "maya.visuals", targetUser: "ryan.travels", postIdx: 0, text: "Great capture of the landscape." },
    { author: "alex.frames", targetUser: "ryan.travels", postIdx: 1, text: "Street photography at its best!" },
  ];

  for (const c of commentsConfig) {
    const author = userMap.get(c.author)!;
    const postId = postMap.get(`${c.targetUser}_${c.postIdx}`);
    if (!postId) continue;

    const existingComment = await prisma.comment.findFirst({
      where: {
        postId,
        authorId: author.id,
        content: c.text,
      },
    });

    if (!existingComment) {
      const newComment = await prisma.comment.create({
        data: {
          postId,
          authorId: author.id,
          content: c.text,
        },
      });

      await notificationService.createCommentNotification({
        actorId: author.id,
        postId,
        commentId: newComment.id,
      });
    }
  }

  console.log("Synthetic demo seeding completed successfully.");
}

if (require.main === module) {
  seedDemoData()
    .catch((e) => {
      console.error("Error seeding demo data:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
