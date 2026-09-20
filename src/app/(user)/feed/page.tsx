import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { FeedView } from "@/components/feed/FeedView";
import { PostItem } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/feed");
  }

  // Fetch following IDs
  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  const feedAuthorIds = [user.id, ...following.map((f) => f.followingId)];

  // Query real feed posts
  const rawPosts = await prisma.post.findMany({
    where: {
      authorId: { in: feedAuthorIds },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      caption: true,
      mediaUrl: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      likes: {
        where: { userId: user.id },
        select: { id: true },
        take: 1,
      },
    },
  });

  // Query suggested accounts not yet followed
  const rawSuggestions = await prisma.user.findMany({
    where: {
      id: {
        notIn: feedAuthorIds,
      },
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  const initialPosts: PostItem[] = rawPosts.map((p) => ({
    id: p.id,
    imageUrl: p.mediaUrl,
    caption: p.caption || "",
    createdAt: p.createdAt,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
    isLiked: p.likes.length > 0,
    author: {
      id: p.author.id,
      username: p.author.username,
      displayName: p.author.profile?.displayName || null,
      avatarUrl: p.author.profile?.avatarUrl || null,
    },
  }));

  const suggestedUsers = rawSuggestions.map((s) => ({
    id: s.id,
    username: s.username,
    displayName: s.profile?.displayName || null,
    avatarUrl: s.profile?.avatarUrl || null,
  }));

  return (
    <div className="py-2">
      <FeedView
        currentUser={{
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          displayName: user.profile?.displayName || null,
          avatarUrl: user.profile?.avatarUrl || null,
        }}
        initialPosts={initialPosts}
        suggestedUsers={suggestedUsers}
      />
    </div>
  );
}
