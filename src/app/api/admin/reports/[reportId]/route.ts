import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";
import { ReportStatus, UserStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/reports/[reportId]
 * Updates report status (REVIEWED, DISMISSED, ACTION_TAKEN) and optionally performs moderation actions.
 * Strictly ADMIN-only. All actions are audited.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { reportId } = await params;
    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes, actionType } = body;

    if (!status || !Object.values(ReportStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be REVIEWED, DISMISSED, or ACTION_TAKEN." },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Execute Moderation Actions if actionType is supplied
    let actionDetails = "";

    if (status === "ACTION_TAKEN") {
      if (actionType === "DELETE_TARGET" || !actionType) {
        if (report.targetType === "POST") {
          const post = await prisma.post.findUnique({ where: { id: report.targetId } });
          if (post) {
            await prisma.post.delete({ where: { id: report.targetId } });
            actionDetails = `Deleted reported post ${report.targetId}`;
            await securityAuditService.logEvent({
              actorId: admin.id,
              action: "POST_MODERATED",
              metadata: { postId: report.targetId, source: "REPORT_RESOLUTION", reportId },
            });
          }
        } else if (report.targetType === "COMMENT") {
          const comment = await prisma.comment.findUnique({ where: { id: report.targetId } });
          if (comment) {
            await prisma.comment.delete({ where: { id: report.targetId } });
            actionDetails = `Deleted reported comment ${report.targetId}`;
            await securityAuditService.logEvent({
              actorId: admin.id,
              action: "COMMENT_MODERATED",
              metadata: { commentId: report.targetId, source: "REPORT_RESOLUTION", reportId },
            });
          }
        }
      } else if (actionType === "SUSPEND_USER") {
        let userIdToSuspend = "";
        if (report.targetType === "USER") {
          userIdToSuspend = report.targetId;
        } else if (report.targetType === "POST") {
          const post = await prisma.post.findUnique({ where: { id: report.targetId }, select: { authorId: true } });
          if (post) userIdToSuspend = post.authorId;
        } else if (report.targetType === "COMMENT") {
          const comment = await prisma.comment.findUnique({ where: { id: report.targetId }, select: { authorId: true } });
          if (comment) userIdToSuspend = comment.authorId;
        }

        if (userIdToSuspend) {
          if (userIdToSuspend === admin.id) {
            return NextResponse.json(
              { error: "Administrative Self-Protection: You cannot suspend your own account." },
              { status: 400 }
            );
          }
          await prisma.user.update({
            where: { id: userIdToSuspend },
            data: { status: UserStatus.SUSPENDED },
          });
          actionDetails = `Suspended user ${userIdToSuspend}`;
          await securityAuditService.logEvent({
            actorId: admin.id,
            action: "USER_SUSPENDED",
            metadata: { targetUserId: userIdToSuspend, source: "REPORT_RESOLUTION", reportId },
          });
        }
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as ReportStatus,
        notes: notes !== undefined ? notes : (actionDetails ? actionDetails : report.notes),
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });

    const auditActionName =
      status === "DISMISSED"
        ? "REPORT_DISMISSED"
        : status === "REVIEWED"
        ? "REPORT_REVIEWED"
        : "REPORT_ACTION_TAKEN";

    await securityAuditService.logEvent({
      actorId: admin.id,
      action: auditActionName,
      metadata: {
        reportId: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        status,
        actionDetails,
      },
    });

    return NextResponse.json({
      message: `Report marked as ${status}.`,
      report: updatedReport,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("PATCH /api/admin/reports/[reportId] error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
