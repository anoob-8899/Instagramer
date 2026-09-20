import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { UserX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  // 1. Fetch user profile safely from the database (strictly excluding all sensitive auth fields)
  const targetUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: decodedUsername,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
      profile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
        },
      },
    },
  });

  // 2. Fetch authenticated user to determine ownership and follow state
  const currentUser = await getCurrentUser();

  // 3. If target user does not exist, show friendly Not Found screen
  if (!targetUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600">
          <UserX className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          User Not Found
        </h1>
        <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The account for{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            @{decodedUsername}
          </span>{" "}
          could not be found or may have been removed.
        </p>
        <div className="mt-6">
          <Link href="/feed">
            <Button variant="outline" className="gap-2 text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Feed</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile =
    currentUser !== null &&
    currentUser.username.toLowerCase() === targetUser.username.toLowerCase();

  // 4. Query real database counts
  const [postsCount, followersCount, followingCount, isFollowingRecord, rawPosts] =
    await Promise.all([
      prisma.post.count({
        where: { authorId: targetUser.id },
      }),
      prisma.follow.count({
        where: { followingId: targetUser.id },
      }),
      prisma.follow.count({
        where: { followerId: targetUser.id },
      }),
      currentUser && !isOwnProfile
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: targetUser.id,
              },
            },
            select: { id: true },
          })
        : null,
      prisma.post.findMany({
        where: { authorId: targetUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          caption: true,
          mediaUrl: true,
          createdAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
    ]);

  const profileData = {
    id: targetUser.id,
    username: targetUser.username,
    displayName: targetUser.profile?.displayName || null,
    bio: targetUser.profile?.bio || null,
    avatarUrl: targetUser.profile?.avatarUrl || null,
    createdAt: targetUser.createdAt,
  };

  const formattedPosts = rawPosts.map((p) => ({
    id: p.id,
    author: {
      id: targetUser.id,
      username: targetUser.username,
      displayName: targetUser.profile?.displayName || null,
      avatarUrl: targetUser.profile?.avatarUrl || null,
    },
    imageUrl: p.mediaUrl,
    caption: p.caption || "",
    createdAt: p.createdAt,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
  }));

  return (
    <div className="mx-auto max-w-4xl py-4 space-y-6">
      <ProfileHeader
        user={profileData}
        isOwnProfile={isOwnProfile}
        isFollowingInitial={Boolean(isFollowingRecord)}
        postsCount={postsCount}
        followersCount={followersCount}
        followingCount={followingCount}
      />

      <ProfileGrid posts={formattedPosts} isOwnProfile={isOwnProfile} />
    </div>
  );
}
