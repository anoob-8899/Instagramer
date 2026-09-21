import { NextResponse } from "next/server";
import { getSecuritySettings } from "@/lib/security/securitySettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSecuritySettings();
    return NextResponse.json({
      classroomModeEnabled: settings.classroomModeEnabled,
      messageSecurityEnabled: settings.messageSecurityEnabled,
      messageRepresentation: settings.messageRepresentation,
    });
  } catch {
    return NextResponse.json({
      classroomModeEnabled: false,
      messageSecurityEnabled: true,
      messageRepresentation: "PROTECTED",
    });
  }
}
