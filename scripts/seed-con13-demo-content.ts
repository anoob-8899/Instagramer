import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService } from "../src/security/passwordHashing";
import { notificationService } from "../src/lib/notifications/notificationService";

// Safe, high-definition thematic SVG Data URIs for demo post media
function createSvgDataUri(title: string, subtitle: string, color1: string, color2: string, color3: string, iconType: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="50%" stop-color="${color2}"/>
        <stop offset="100%" stop-color="${color3}"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <rect width="800" height="800" fill="url(#bg)"/>
    <circle cx="400" cy="350" r="220" fill="white" fill-opacity="0.08" filter="url(#glow)"/>
    <circle cx="400" cy="350" r="140" fill="white" fill-opacity="0.12"/>
    ${getSvgIcon(iconType)}
    <text x="400" y="580" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="32" letter-spacing="0.5">${title}</text>
    <text x="400" y="625" text-anchor="middle" fill="#ffffff" fill-opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="20">${subtitle}</text>
    <rect x="350" y="660" width="100" height="4" rx="2" fill="#ffffff" fill-opacity="0.5"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getSvgIcon(iconType: string): string {
  switch (iconType) {
    case "camera":
      return `<path d="M340 310 h120 l20 30 h50 a30 30 0 0 1 30 30 v120 a30 30 0 0 1 -30 30 h-260 a30 30 0 0 1 -30 -30 v-120 a30 30 0 0 1 30 -30 h50 z" fill="none" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
              <circle cx="400" cy="410" r="45" fill="none" stroke="#ffffff" stroke-width="12"/>`;
    case "film":
      return `<rect x="280" y="270" width="240" height="180" rx="16" fill="none" stroke="#ffffff" stroke-width="12"/>
              <polygon points="380,330 440,360 380,390" fill="#ffffff"/>`;
    case "design":
      return `<rect x="290" y="270" width="220" height="170" rx="12" fill="none" stroke="#ffffff" stroke-width="12"/>
              <circle cx="350" cy="330" r="20" fill="#ffffff"/>
              <line x1="390" y1="330" x2="470" y2="330" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
              <line x1="330" y1="380" x2="470" y2="380" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>`;
    case "travel":
      return `<circle cx="400" cy="360" r="75" fill="none" stroke="#ffffff" stroke-width="12"/>
              <path d="M400 250 L400 470 M290 360 L510 360" stroke="#ffffff" stroke-width="8" stroke-dasharray="12 8"/>
              <polygon points="400,280 415,345 400,335 385,345" fill="#ffffff"/>`;
    default:
      return `<circle cx="400" cy="360" r="60" fill="none" stroke="#ffffff" stroke-width="12"/>`;
  }
}

const DEMO_USERS_DATA = [
  {
    username: "maya.visuals",
    displayName: "Maya Thomas",
    email: "maya.visuals@instagramer.local",
    bio: "Visual storyteller • Photography • Kerala",
    theme: "Photography / nature / Kerala",
    posts: [
      {
        caption: "Chasing the last light before the rain.",
        title: "Golden Hour Kerala",
        subtitle: "Wayanad Hills • Monsoon Mist",
        colors: ["#0f4c3a", "#1b8a5a", "#e5a93c"],
        icon: "camera",
      },
      {
        caption: "Some places don't need a filter.",
        title: "Backwater Reflections",
        subtitle: "Alleppey • Quiet Waters",
        colors: ["#134e5e", "#71b280", "#2c3e50"],
        icon: "camera",
      },
      {
        caption: "Golden hour, quiet roads, and a camera.",
        title: "Coastal Twilight",
        subtitle: "Varkala Cliff Road",
        colors: ["#2c3e50", "#fd746c", "#ff9966"],
        icon: "camera",
      },
    ],
  },
  {
    username: "alex.frames",
    displayName: "Alex Joseph",
    email: "alex.frames@instagramer.local",
    bio: "Frames, films & late-night edits 🎬",
    theme: "Filmmaking / editing / cinematic content",
    posts: [
      {
        caption: "Some frames only make sense after midnight.",
        title: "Midnight Cut",
        subtitle: "Timeline & Color Grade",
        colors: ["#0f2027", "#203a43", "#2c5364"],
        icon: "film",
      },
      {
        caption: "From timeline to final frame.",
        title: "Cinematic Suite",
        subtitle: "DaVinci Resolve Setup",
        colors: ["#141e30", "#243b55", "#6a11cb"],
        icon: "film",
      },
      {
        caption: "Lights down. Timeline open. Let's edit.",
        title: "Late Night Render",
        subtitle: "4K Anamorphic Sequence",
        colors: ["#16222a", "#3a6073", "#e94e77"],
        icon: "film",
      },
    ],
  },
  {
    username: "nina.creates",
    displayName: "Nina George",
    email: "nina.creates@instagramer.local",
    bio: "Designing little things that matter ✦",
    theme: "UI/UX / design / creativity / technology",
    posts: [
      {
        caption: "Building ideas one pixel at a time.",
        title: "Minimal Design System",
        subtitle: "Figma Component Architecture",
        colors: ["#232526", "#414345", "#8a2387"],
        icon: "design",
      },
      {
        caption: "Simple interfaces, intentional details.",
        title: "Dark Mode UI Exploration",
        subtitle: "Micro-interactions & Contrast",
        colors: ["#1a103c", "#2b1055", "#7597de"],
        icon: "design",
      },
      {
        caption: "A little typography experiment from today.",
        title: "Geometric Typography",
        subtitle: "Custom Typeface & Layout",
        colors: ["#000000", "#159957", "#155799"],
        icon: "design",
      },
    ],
  },
  {
    username: "ryan.travels",
    displayName: "Ryan Mathew",
    email: "ryan.travels@instagramer.local",
    bio: "Finding new places and documenting the journey 🌍",
    theme: "Travel / street photography / exploration",
    posts: [
      {
        caption: "Another road, another story.",
        title: "Munnar Tea Trails",
        subtitle: "Western Ghats Expedition",
        colors: ["#11998e", "#38ef7d", "#1a2a6c"],
        icon: "travel",
      },
      {
        caption: "One day. Three locations.",
        title: "Old Fort Kochi",
        subtitle: "Street Life & Heritage",
        colors: ["#b92b27", "#1565c0", "#f7b731"],
        icon: "travel",
      },
      {
        caption: "Collecting places instead of things.",
        title: "Sunset Over Fort",
        subtitle: "Coastal Wandering",
        colors: ["#cb2d3e", "#ef473a", "#ffb347"],
        icon: "travel",
      },
    ],
  },
];

async function seedDemoContent() {
  console.log("==================================================");
  console.log("CON 13 — DEMO CONTENT SEEDING STARTING");
  console.log("==================================================");

  // 1. Record Database Counts BEFORE Seeding
  const beforeCounts = {
    users: await prisma.user.count(),
    profiles: await prisma.profile.count(),
    posts: await prisma.post.count(),
    likes: await prisma.like.count(),
    comments: await prisma.comment.count(),
    follows: await prisma.follow.count(),
    notifications: await prisma.notification.count(),
  };

  console.log("\nDATABASE COUNTS BEFORE SEEDING:");
  console.log(`- Users: ${beforeCounts.users}`);
  console.log(`- Profiles: ${beforeCounts.profiles}`);
  console.log(`- Posts: ${beforeCounts.posts}`);
  console.log(`- Likes: ${beforeCounts.likes}`);
  console.log(`- Comments: ${beforeCounts.comments}`);
  console.log(`- Follows: ${beforeCounts.follows}`);
  console.log(`- Notifications: ${beforeCounts.notifications}`);

  // Track created counts for report
  let createdUsersCount = 0;
  let createdPostsCount = 0;
  let createdLikesCount = 0;
  let createdCommentsCount = 0;
  let createdFollowsCount = 0;
  let createdNotificationsCount = 0;

  let duplicateUsersCount = 0;
  let duplicatePostsCount = 0;
  let duplicateLikesCount = 0;
  let duplicateCommentsCount = 0;
  let duplicateFollowsCount = 0;

  // Dictionary of demo user objects for fast access
  const demoUsers: Record<string, { id: string; username: string }> = {};
  const demoPosts: Record<string, string[]> = {}; // username -> array of post IDs

  // 2. Create / Fetch Demo Users and Profiles
  console.log("\n1. SEEDING DEMO USERS & PROFILES...");
  const commonPasswordHash = await passwordHashingService.hashPassword("DemoUser2026!Secure");

  for (const uData of DEMO_USERS_DATA) {
    let user = await prisma.user.findUnique({
      where: { username: uData.username },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: uData.username,
          email: uData.email,
          passwordHash: commonPasswordHash,
          role: "USER",
          status: "ACTIVE",
          profile: {
            create: {
              displayName: uData.displayName,
              bio: uData.bio,
              avatarUrl: null, // Uses application initial gradient avatar fallback
            },
          },
        },
      });
      createdUsersCount++;
      console.log(`  + Created user: @${uData.username} (${uData.displayName})`);
    } else {
      duplicateUsersCount++;
      console.log(`  = Demo user already exists: @${uData.username}`);
      // Ensure profile exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        await prisma.profile.create({
          data: {
            userId: user.id,
            displayName: uData.displayName,
            bio: uData.bio,
          },
        });
      }
    }

    demoUsers[uData.username] = { id: user.id, username: user.username };
    demoPosts[uData.username] = [];
  }

  // 3. Create Demo Posts (3 per user = 12 total)
  console.log("\n2. SEEDING DEMO POSTS...");
  for (const uData of DEMO_USERS_DATA) {
    const user = demoUsers[uData.username];

    for (let i = 0; i < uData.posts.length; i++) {
      const pInfo = uData.posts[i];

      // Check if post with exact caption already exists for this author
      let existingPost = await prisma.post.findFirst({
        where: {
          authorId: user.id,
          caption: pInfo.caption,
        },
      });

      if (!existingPost) {
        const mediaUrl = createSvgDataUri(
          pInfo.title,
          pInfo.subtitle,
          pInfo.colors[0],
          pInfo.colors[1],
          pInfo.colors[2],
          pInfo.icon
        );

        existingPost = await prisma.post.create({
          data: {
            authorId: user.id,
            caption: pInfo.caption,
            mediaUrl: mediaUrl,
            // Offset created timestamps slightly for natural feed sorting
            createdAt: new Date(Date.now() - (12 - createdPostsCount) * 3600 * 1000),
          },
        });
        createdPostsCount++;
        console.log(`  + Created post for @${uData.username}: "${pInfo.caption}"`);
      } else {
        duplicatePostsCount++;
        console.log(`  = Post already exists for @${uData.username}: "${pInfo.caption}"`);
      }

      demoPosts[uData.username].push(existingPost.id);
    }
  }

  // 4. Create Follow Relationships
  console.log("\n3. SEEDING DEMO FOLLOW GRAPH...");
  const followMatrix = [
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

  for (const rel of followMatrix) {
    const follower = demoUsers[rel.follower];
    const following = demoUsers[rel.following];

    if (follower && following) {
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: follower.id,
            followingId: following.id,
          },
        },
      });

      if (!existingFollow) {
        await prisma.follow.create({
          data: {
            followerId: follower.id,
            followingId: following.id,
          },
        });
        createdFollowsCount++;

        // Generate follow notification
        await notificationService.createFollowNotification({
          actorId: follower.id,
          followingId: following.id,
        });
        createdNotificationsCount++;

        console.log(`  + Follow: @${rel.follower} → @${rel.following}`);
      } else {
        duplicateFollowsCount++;
      }
    }
  }

  // 5. Create Cross-User Likes
  console.log("\n4. SEEDING DEMO LIKES...");
  // Like pattern: Maya likes Alex & Nina; Alex likes Maya & Ryan; Nina likes Maya & Alex; Ryan likes Nina & Maya
  const likePairs = [
    // Maya likes Alex's post 0 & 1, Nina's post 0 & 1
    { liker: "maya.visuals", targetAuthor: "alex.frames", postIndex: 0 },
    { liker: "maya.visuals", targetAuthor: "alex.frames", postIndex: 1 },
    { liker: "maya.visuals", targetAuthor: "nina.creates", postIndex: 0 },
    { liker: "maya.visuals", targetAuthor: "nina.creates", postIndex: 1 },
    // Alex likes Maya's post 0 & 2, Ryan's post 0 & 1
    { liker: "alex.frames", targetAuthor: "maya.visuals", postIndex: 0 },
    { liker: "alex.frames", targetAuthor: "maya.visuals", postIndex: 2 },
    { liker: "alex.frames", targetAuthor: "ryan.travels", postIndex: 0 },
    { liker: "alex.frames", targetAuthor: "ryan.travels", postIndex: 1 },
    // Nina likes Maya's post 0 & 1, Alex's post 0 & 2, Ryan's post 0
    { liker: "nina.creates", targetAuthor: "maya.visuals", postIndex: 0 },
    { liker: "nina.creates", targetAuthor: "maya.visuals", postIndex: 1 },
    { liker: "nina.creates", targetAuthor: "alex.frames", postIndex: 0 },
    { liker: "nina.creates", targetAuthor: "alex.frames", postIndex: 2 },
    { liker: "nina.creates", targetAuthor: "ryan.travels", postIndex: 0 },
    // Ryan likes Nina's post 0 & 1, Maya's post 0 & 2
    { liker: "ryan.travels", targetAuthor: "nina.creates", postIndex: 0 },
    { liker: "ryan.travels", targetAuthor: "nina.creates", postIndex: 1 },
    { liker: "ryan.travels", targetAuthor: "maya.visuals", postIndex: 0 },
    { liker: "ryan.travels", targetAuthor: "maya.visuals", postIndex: 2 },
  ];

  for (const pair of likePairs) {
    const liker = demoUsers[pair.liker];
    const postId = demoPosts[pair.targetAuthor]?.[pair.postIndex];

    if (liker && postId) {
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: liker.id,
            postId: postId,
          },
        },
      });

      if (!existingLike) {
        await prisma.like.create({
          data: {
            userId: liker.id,
            postId: postId,
          },
        });
        createdLikesCount++;

        // Notification
        await notificationService.createLikeNotification({
          actorId: liker.id,
          postId: postId,
        });
        createdNotificationsCount++;
      } else {
        duplicateLikesCount++;
      }
    }
  }
  console.log(`  + Created ${createdLikesCount} cross-user likes.`);

  // 6. Create Fictional Comments
  console.log("\n5. SEEDING DEMO COMMENTS...");
  const commentMatrix = [
    // Maya's post 0
    { commenter: "alex.frames", author: "maya.visuals", postIdx: 0, text: "That light is incredible." },
    { commenter: "nina.creates", author: "maya.visuals", postIdx: 0, text: "Love the composition." },
    // Maya's post 1
    { commenter: "ryan.travels", author: "maya.visuals", postIdx: 1, text: "Where is this?" },
    { commenter: "alex.frames", author: "maya.visuals", postIdx: 1, text: "Absolutely beautiful frame." },
    // Maya's post 2
    { commenter: "nina.creates", author: "maya.visuals", postIdx: 2, text: "Great atmosphere." },

    // Alex's post 0
    { commenter: "maya.visuals", author: "alex.frames", postIdx: 0, text: "This looks cinematic." },
    { commenter: "ryan.travels", author: "alex.frames", postIdx: 0, text: "That transition looks amazing." },
    // Alex's post 1
    { commenter: "nina.creates", author: "alex.frames", postIdx: 1, text: "This is clean." },
    { commenter: "maya.visuals", author: "alex.frames", postIdx: 1, text: "The color grade is on point." },
    // Alex's post 2
    { commenter: "ryan.travels", author: "alex.frames", postIdx: 2, text: "Late night grinding! Looks great." },

    // Nina's post 0
    { commenter: "maya.visuals", author: "nina.creates", postIdx: 0, text: "Super crisp design!" },
    { commenter: "alex.frames", author: "nina.creates", postIdx: 0, text: "Love the minimalism." },
    // Nina's post 1
    { commenter: "ryan.travels", author: "nina.creates", postIdx: 1, text: "The contrast works so well." },
    { commenter: "maya.visuals", author: "nina.creates", postIdx: 1, text: "Intentional details make all the difference." },
    // Nina's post 2
    { commenter: "alex.frames", author: "nina.creates", postIdx: 2, text: "Awesome typography experiment." },

    // Ryan's post 0
    { commenter: "maya.visuals", author: "ryan.travels", postIdx: 0, text: "Munnar is always magic!" },
    { commenter: "nina.creates", author: "ryan.travels", postIdx: 0, text: "Adding this location to my bucket list." },
    // Ryan's post 1
    { commenter: "alex.frames", author: "ryan.travels", postIdx: 1, text: "Fort Kochi has the best street frames." },
    { commenter: "maya.visuals", author: "ryan.travels", postIdx: 1, text: "Great capture of the heritage vibes." },
    // Ryan's post 2
    { commenter: "nina.creates", author: "ryan.travels", postIdx: 2, text: "Golden hour goals! 🌅" },
  ];

  for (const cData of commentMatrix) {
    const commenter = demoUsers[cData.commenter];
    const postId = demoPosts[cData.author]?.[cData.postIdx];

    if (commenter && postId) {
      const existingComment = await prisma.comment.findFirst({
        where: {
          postId: postId,
          authorId: commenter.id,
          content: cData.text,
        },
      });

      if (!existingComment) {
        const comment = await prisma.comment.create({
          data: {
            postId: postId,
            authorId: commenter.id,
            content: cData.text,
          },
        });
        createdCommentsCount++;

        // Notification
        await notificationService.createCommentNotification({
          actorId: commenter.id,
          postId: postId,
          commentId: comment.id,
        });
        createdNotificationsCount++;
      } else {
        duplicateCommentsCount++;
      }
    }
  }
  console.log(`  + Created ${createdCommentsCount} safe comments.`);

  // 7. Record Database Counts AFTER Seeding
  const afterCounts = {
    users: await prisma.user.count(),
    profiles: await prisma.profile.count(),
    posts: await prisma.post.count(),
    likes: await prisma.like.count(),
    comments: await prisma.comment.count(),
    follows: await prisma.follow.count(),
    notifications: await prisma.notification.count(),
  };

  console.log("\n==================================================");
  console.log("CON 13 — SEEDING SUMMARY");
  console.log("==================================================");
  console.log("DATABASE COUNTS AFTER SEEDING:");
  console.log(`- Users: ${afterCounts.users} (+${afterCounts.users - beforeCounts.users})`);
  console.log(`- Profiles: ${afterCounts.profiles} (+${afterCounts.profiles - beforeCounts.profiles})`);
  console.log(`- Posts: ${afterCounts.posts} (+${afterCounts.posts - beforeCounts.posts})`);
  console.log(`- Likes: ${afterCounts.likes} (+${afterCounts.likes - beforeCounts.likes})`);
  console.log(`- Comments: ${afterCounts.comments} (+${afterCounts.comments - beforeCounts.comments})`);
  console.log(`- Follows: ${afterCounts.follows} (+${afterCounts.follows - beforeCounts.follows})`);
  console.log(`- Notifications: ${afterCounts.notifications} (+${afterCounts.notifications - beforeCounts.notifications})`);

  console.log("\nDUPLICATE PROTECTION COUNTS:");
  console.log(`- Duplicate Users: ${duplicateUsersCount}`);
  console.log(`- Duplicate Posts: ${duplicatePostsCount}`);
  console.log(`- Duplicate Likes: ${duplicateLikesCount}`);
  console.log(`- Duplicate Comments: ${duplicateCommentsCount}`);
  console.log(`- Duplicate Follows: ${duplicateFollowsCount}`);
  console.log("==================================================\n");

  // Summary object per user for report
  const userStats = {
    maya: {
      posts: await prisma.post.count({ where: { authorId: demoUsers["maya.visuals"]?.id } }),
      likesReceived: await prisma.like.count({ where: { post: { authorId: demoUsers["maya.visuals"]?.id } } }),
      commentsReceived: await prisma.comment.count({ where: { post: { authorId: demoUsers["maya.visuals"]?.id } } }),
    },
    alex: {
      posts: await prisma.post.count({ where: { authorId: demoUsers["alex.frames"]?.id } }),
      likesReceived: await prisma.like.count({ where: { post: { authorId: demoUsers["alex.frames"]?.id } } }),
      commentsReceived: await prisma.comment.count({ where: { post: { authorId: demoUsers["alex.frames"]?.id } } }),
    },
    nina: {
      posts: await prisma.post.count({ where: { authorId: demoUsers["nina.creates"]?.id } }),
      likesReceived: await prisma.like.count({ where: { post: { authorId: demoUsers["nina.creates"]?.id } } }),
      commentsReceived: await prisma.comment.count({ where: { post: { authorId: demoUsers["nina.creates"]?.id } } }),
    },
    ryan: {
      posts: await prisma.post.count({ where: { authorId: demoUsers["ryan.travels"]?.id } }),
      likesReceived: await prisma.like.count({ where: { post: { authorId: demoUsers["ryan.travels"]?.id } } }),
      commentsReceived: await prisma.comment.count({ where: { post: { authorId: demoUsers["ryan.travels"]?.id } } }),
    },
  };

  return {
    beforeCounts,
    afterCounts,
    userStats,
    created: {
      users: createdUsersCount,
      posts: createdPostsCount,
      likes: createdLikesCount,
      comments: createdCommentsCount,
      follows: createdFollowsCount,
      notifications: createdNotificationsCount,
    },
    duplicates: {
      users: duplicateUsersCount,
      posts: duplicatePostsCount,
      likes: duplicateLikesCount,
      comments: duplicateCommentsCount,
      follows: duplicateFollowsCount,
    },
  };
}

// Run seed if executed directly
seedDemoContent()
  .then(() => {
    console.log("CON 13 Seed Script completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("CON 13 Seed Script failed:", err);
    process.exit(1);
  });
