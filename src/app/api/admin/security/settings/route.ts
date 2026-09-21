import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { getSecuritySettings, updateSecuritySettings } from "@/lib/security/securitySettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSecuritySettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch security settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const previousSettings = await getSecuritySettings();
    const updated = await updateSecuritySettings(body);

    // Audit and Security Events
    if (body.classroomModeEnabled !== undefined && body.classroomModeEnabled !== previousSettings.classroomModeEnabled) {
      await prisma.securityEvent.create({
        data: {
          eventType: body.classroomModeEnabled ? "CLASSROOM_MODE_ENABLED" : "CLASSROOM_MODE_DISABLED",
          username: admin.username,
          userId: admin.id,
          success: true,
          metadata: JSON.stringify({ toggledBy: admin.username }),
        },
      });
    } else {
      await prisma.securityEvent.create({
        data: {
          eventType: "SECURITY_SETTING_CHANGED",
          username: admin.username,
          userId: admin.id,
          success: true,
          metadata: JSON.stringify({ changes: body }),
        },
      });
    }

    return NextResponse.json({ message: "Security settings updated successfully.", settings: updated });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update security settings" }, { status: 500 });
  }
}
