import { PostItem } from "@/types/post";

/**
 * In-Memory Demo Presentation Posts
 * FOR CON 04 UI EVALUATION ONLY
 * 
 * NOTE: These items are strictly non-persistent and in-memory.
 * No data is inserted into the PostgreSQL database.
 */
export const DEMO_PRESENTATION_POSTS: PostItem[] = [
  {
    id: "demo-post-1",
    author: {
      id: "demo-user-1",
      username: "elena_designs",
      displayName: "Elena Vance",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    caption: "Exploring minimal geometric compositions for the new creative studio launch. Which color palette resonates most? ✨🎨 #design #minimalism #creativestudio",
    createdAt: "2 hours ago",
    likesCount: 142,
    commentsCount: 18,
    isDemo: true,
  },
  {
    id: "demo-post-2",
    author: {
      id: "demo-user-2",
      username: "marcus_codes",
      displayName: "Marcus Chen",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    caption: "Late evening session polishing Next.js App Router architecture and server components. The developer velocity with modern tooling is unmatched. 💻⚡ #webdev #nextjs #fullstack",
    createdAt: "5 hours ago",
    likesCount: 289,
    commentsCount: 34,
    isDemo: true,
  },
];
