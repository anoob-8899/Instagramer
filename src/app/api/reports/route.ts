import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";
import { ReportTargetType } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/reports
 * Submits a new user report for a post, comment, or user account.
 * Requires authenticated, active user.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { targetType, targetId, reason } = body;

    // Validate targetType
    if (!targetType || !Object.values(ReportTargetType).includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid or missing report target type. Must be POST, COMMENT, or USER." },
        { status: 400 }
      );
    }

    // Validate targetId
    if (!targetId || typeof targetId !== "string" || targetId.trim() === "") {
      return NextResponse.json({ error: "Target ID is required." }, { status: 400 });
    }

    // Validate reason
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "A valid report reason is required." }, { status: 400 });
    }

    const cleanReason = reason.trim().slice(0, 500);

    // Verify target exists in database
    if (targetType === "POST") {
      const post = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!post) {
        return NextResponse.json({ error: "Reported post does not exist." }, { status: 404 });
      }
    } else if (targetType === "COMMENT") {
      const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!comment) {
        return NextResponse.json({ error: "Reported comment does not exist." }, { status: 404 });
      }
    } else if (targetType === "USER") {
      const targetUser = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!targetUser) {
        return NextResponse.json({ error: "Reported user does not exist." }, { status: 404 });
      }
    }

    // Prevent duplicate pending reports from the same user on the same target
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        targetType,
        targetId,
        status: "PENDING",
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { message: "You have already submitted a pending report for this item. Our moderation team is reviewing it." },
        { status: 200 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason: cleanReason,
        status: "PENDING",
      },
    });

    await securityAuditService.logEvent({
      actorId: user.id,
      action: "REPORT_CREATED",
      metadata: {
        reportId: report.id,
        targetType,
        targetId,
        reason: cleanReason,
      },
    });

    return NextResponse.json({
      message: "Report submitted successfully. Thank you for keeping our community safe.",
      reportId: report.id,
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("AccountSuspended")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }
}
