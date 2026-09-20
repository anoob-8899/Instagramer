"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImagePlus, Sparkles, Loader2, AlertCircle } from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewValid, setImagePreviewValid] = useState<boolean | null>(null);

  const handleMediaUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMediaUrl(val);
    setImagePreviewValid(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mediaUrl.trim()) {
      setError("Please provide a valid image URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: mediaUrl.trim(),
          caption: caption.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      router.push("/feed");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while creating the post");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Create New Post
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Share your favorite moments, artwork, and updates with your community
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200/90 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
            New Post Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Media URL Preview Container */}
            <div className="relative flex min-h-[220px] max-h-[360px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/30">
              {mediaUrl.trim() && imagePreviewValid !== false ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl.trim()}
                  alt="Post preview"
                  onLoad={() => setImagePreviewValid(true)}
                  onError={() => setImagePreviewValid(false)}
                  className="max-h-[320px] w-auto max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <ImagePlus className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {imagePreviewValid === false
                      ? "Unable to load image from URL"
                      : "Enter an image URL below to preview"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Supports JPG, PNG, WebP, and Unsplash URLs
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Media URL"
              placeholder="https://images.unsplash.com/photo-..."
              value={mediaUrl}
              onChange={handleMediaUrlChange}
              required
              helperText="Provide a direct image URL for your post"
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write an engaging caption..."
                maxLength={2200}
                rows={4}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>Maximum 2,200 characters</span>
                <span>{caption.length} / 2200</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Posts are published immediately to your profile and your followers&apos; feeds.</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !mediaUrl.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <span>Publish Post</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
