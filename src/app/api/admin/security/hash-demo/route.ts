import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { passwordHashingService, ARGON2ID_CONFIG } from "@/security/passwordHashing";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/security/hash-demo
 * 
 * Educational/Classroom Demonstration Endpoint for Argon2id Password Hashing & Verification.
 * STRICT REQUIREMENTS:
 * - ADMIN-only authorization required.
 * - Operates strictly in-memory on synthetic sample inputs.
 * - Zero database writes, zero credential persistence, zero logging of inputs.
 * - Returns technical cryptographic telemetry to demonstrate memory-hardness and KDF parameters.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const action = body?.action || "hash";

    if (action === "verify") {
      const candidate = typeof body?.candidatePassword === "string" ? body.candidatePassword : "";
      const hashToVerify = typeof body?.hashToVerify === "string" ? body.hashToVerify : "";

      if (!hashToVerify) {
        return NextResponse.json(
          { error: "Hash string is required for verification demonstration." },
          { status: 400 }
        );
      }

      const startTime = performance.now();
      const isMatch = await passwordHashingService.verifyPassword(candidate, hashToVerify);
      const elapsedMs = Math.round((performance.now() - startTime) * 100) / 100;

      return NextResponse.json({
        success: true,
        action: "verify",
        matched: isMatch,
        candidateInput: candidate,
        computationTimeMs: elapsedMs,
        message: isMatch
          ? "Password verification succeeded (Argon2id pre-image matches hash)."
          : "Password verification failed (Cryptographic hash mismatch).",
      });
    }

    // Default: Hash generation
    const sampleInput = typeof body?.samplePassword === "string" && body.samplePassword.length > 0
      ? body.samplePassword
      : "ExamplePassword123!";

    const startTime = performance.now();
    const hash = await passwordHashingService.hashPassword(sampleInput);
    const elapsedMs = Math.round((performance.now() - startTime) * 100) / 100;

    const metadata = passwordHashingService.parseHashMetadata(hash);
    const parts = hash.split("$");
    const rawSalt = parts.length > 4 ? parts[parts.length - 2] : "N/A";
    const rawDigest = parts.length > 4 ? parts[parts.length - 1] : "N/A";

    return NextResponse.json({
      success: true,
      action: "hash",
      syntheticInput: sampleInput,
      hashResult: hash,
      telemetry: {
        algorithm: "Argon2id (Hybrid Memory-Hard KDF)",
        version: metadata.version ?? 19,
        memoryCost: `${((ARGON2ID_CONFIG.memoryCost ?? 65536) / 1024).toFixed(0)} MB (${ARGON2ID_CONFIG.memoryCost ?? 65536} KiB)`,
        memoryCostKiB: ARGON2ID_CONFIG.memoryCost ?? 65536,
        timeCostIterations: ARGON2ID_CONFIG.timeCost ?? 3,
        parallelismThreads: ARGON2ID_CONFIG.parallelism ?? 1,
        saltExtracted: rawSalt,
        digestExtracted: rawDigest,
        computationTimeMs: elapsedMs,
        securityProperty: "Resistant to GPU/ASIC parallel brute-force attacks and side-channel timing attacks",
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Unauthorized") ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to execute synthetic cryptographic demonstration" },
      { status: 500 }
    );
  }
}

