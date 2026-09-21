"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  Layers,
  Flame,
  ArrowLeft,
  Eye,
  EyeOff,
  Cookie,
  FileText,
  MessageSquare,
  Network,
  RotateCcw,
  Sliders,
  Tv,
  ChevronRight,
  ChevronLeft,
  Info,
  KeyRound,
  Server,
  Shield,
  Zap,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  generateUserKeyPair,
  exportPublicKey,
  deriveSharedAesKey,
  encryptMessage,
  decryptMessage,
} from "@/security/encryption";
import { sanitizeMetadata } from "@/security/audit";

// --- Types ---
interface HashDemoResponse {
  success: boolean;
  action: "hash";
  syntheticInput: string;
  hashResult: string;
  telemetry: {
    algorithm: string;
    version: number;
    memoryCost: string;
    memoryCostKiB: number;
    timeCostIterations: number;
    parallelismThreads: number;
    saltExtracted: string;
    digestExtracted: string;
    computationTimeMs: number;
    securityProperty: string;
  };
}

interface VerifyDemoResponse {
  success: boolean;
  action: "verify";
  matched: boolean;
  candidateInput: string;
  computationTimeMs: number;
  message: string;
}

export default function SecurityLaboratoryPage() {
  // Navigation & Mode State
  const [activeSection, setActiveSection] = useState<string>("all");
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // --- SECTION 1: PASSWORD HASHING & VERIFICATION STATE ---
  const [samplePassword, setSamplePassword] = useState<string>("ExamplePassword123!");
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [hashData, setHashData] = useState<HashDemoResponse | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);

  // Hash Verification State
  const [candidatePassword, setCandidatePassword] = useState<string>("ExamplePassword123!");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<VerifyDemoResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // --- SECTION 2: ACCOUNT LOCKOUT STATE ---
  const [simAttempts, setSimAttempts] = useState<number>(0);
  const [simLockedUntil, setSimLockedUntil] = useState<Date | null>(null);
  const [simLog, setSimLog] = useState<Array<{ text: string; type: "fail" | "lock" | "success" | "unlock" }>>([]);

  // --- SECTION 3: SESSION SECURITY STATE ---
  const [sessionRawToken, setSessionRawToken] = useState<string>("");
  const [sessionHashedToken, setSessionHashedToken] = useState<string>("");
  const [isGeneratingSession, setIsGeneratingSession] = useState<boolean>(false);

  // --- SECTION 4: AUDIT LOGGING & SANITIZATION STATE ---
  const [auditPayloadText, setAuditPayloadText] = useState<string>(
    JSON.stringify(
      {
        actorId: "usr_sim_89a12c",
        action: "USER_LOGIN_ATTEMPT",
        ipAddress: "192.168.1.42",
        password: "SuperSecretPassword2026!",
        sessionToken: "a4f891b2c3d4e5f67890123456789abcdef0123456789abcdef",
        apiKey: "ig_live_sk_993847291038475",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...\n-----END PRIVATE KEY-----",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      null,
      2
    )
  );
  const [sanitizedOutput, setSanitizedOutput] = useState<Record<string, unknown> | null>(null);

  // --- SECTION 5: E2EE CRYPTOGRAPHY STATE ---
  const [e2eePlaintext, setE2eePlaintext] = useState<string>("Confidential message protected by Instagramer E2EE.");
  const [isE2eeRunning, setIsE2eeRunning] = useState<boolean>(false);
  const [e2eeState, setE2eeState] = useState<{
    alicePublicJwk: string;
    bobPublicJwk: string;
    sharedSecretHex: string;
    ivBase64: string;
    ciphertextBase64: string;
    fullCiphertextPayload: string;
    decryptedPlaintext: string;
    tamperedCiphertext: string;
    tamperError: string | null;
    tamperPassed: boolean;
  } | null>(null);

  // --- SECTION 0: SYNTHETIC ARGON2ID BRUTE-FORCE SIMULATION STATE ---
  const SYNTHETIC_TARGET_PASSWORD = "482915";
  const SYNTHETIC_TARGET_HASH =
    "$argon2id$v=19$m=65536,t=3,p=1$c3ludGhldGljc2FsdDEyMw$k8F3mL9P2qW5vX7rT1yZ4nJ6bV8cC0dE2fG4hI6jK8L";

  const [bruteForceMode, setBruteForceMode] = useState<"SIMULATED_VULNERABLE" | "SIMULATED_PROTECTED">(
    "SIMULATED_VULNERABLE"
  );
  const [bruteForceStatus, setBruteForceStatus] = useState<"IDLE" | "RUNNING" | "MATCH_FOUND" | "PROTECTED_BLOCKED">(
    "IDLE"
  );
  const [bruteForceProgress, setBruteForceProgress] = useState<number>(0);
  const [bruteForceLogs, setBruteForceLogs] = useState<
    Array<{ id: string; text: string; type: "info" | "mismatch" | "match" | "blocked" | "rate_limit" | "lockout" }>
  >([]);

  const runSyntheticBruteForceDemo = async () => {
    if (bruteForceStatus === "RUNNING") return;

    setBruteForceStatus("RUNNING");
    setBruteForceProgress(0);
    setBruteForceLogs([]);

    const addLog = (
      text: string,
      type: "info" | "mismatch" | "match" | "blocked" | "rate_limit" | "lockout"
    ) => {
      setBruteForceLogs((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), text, type }]);
    };

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    if (bruteForceMode === "SIMULATED_VULNERABLE") {
      addLog("> INITIALIZING HASH VERIFICATION", "info");
      addLog("> TARGET FORMAT: NUMERIC / 6 DIGIT", "info");
      addLog("> SEARCH SPACE: 1,000,000 POSSIBILITIES", "info");
      addLog(`> TARGET HASH: ${SYNTHETIC_TARGET_HASH.substring(0, 34)}...`, "info");
      await sleep(350);

      addLog("000000    HASH MISMATCH", "mismatch");
      setBruteForceProgress(1);
      await sleep(200);

      addLog("000001    HASH MISMATCH", "mismatch");
      setBruteForceProgress(2);
      await sleep(200);

      addLog("000002    HASH MISMATCH", "mismatch");
      setBruteForceProgress(3);
      await sleep(200);

      addLog("> ACCELERATING CANDIDATE SCAN... [000003 -> 482909]", "info");
      setBruteForceProgress(25);
      await sleep(300);
      setBruteForceProgress(50);
      await sleep(300);
      setBruteForceProgress(75);
      await sleep(350);

      addLog("482910    HASH MISMATCH", "mismatch");
      await sleep(180);
      addLog("482911    HASH MISMATCH", "mismatch");
      await sleep(180);
      addLog("482912    HASH MISMATCH", "mismatch");
      await sleep(180);
      addLog("482913    HASH MISMATCH", "mismatch");
      await sleep(180);
      addLog("482914    HASH MISMATCH", "mismatch");
      setBruteForceProgress(99);
      await sleep(300);

      addLog("482915    MATCH DETECTED", "match");
      addLog("> SUCCESS: SYNTHETIC CANDIDATE MATCHED (482915)", "match");
      setBruteForceProgress(100);
      setBruteForceStatus("MATCH_FOUND");
    } else {
      addLog("> INITIALIZING HASH VERIFICATION", "info");
      addLog("> ENFORCING DEFENSE-IN-DEPTH CONTROLS: ARGON2ID + RATE LIMITING + ACCOUNT LOCKOUT", "info");
      await sleep(350);

      addLog("ATTEMPT 1/5: 000000 -> FAILED (HTTP 401 Unauthorized)", "mismatch");
      setBruteForceProgress(20);
      await sleep(250);

      addLog("ATTEMPT 2/5: 000001 -> FAILED (HTTP 401 Unauthorized)", "mismatch");
      setBruteForceProgress(40);
      await sleep(250);

      addLog("ATTEMPT 3/5: 000002 -> FAILED (HTTP 401 Unauthorized)", "mismatch");
      setBruteForceProgress(60);
      await sleep(250);

      addLog("ATTEMPT 4/5: 000003 -> FAILED (HTTP 401 Unauthorized)", "mismatch");
      setBruteForceProgress(80);
      await sleep(250);

      addLog("ATTEMPT 5/5: 000004 -> FAILED (HTTP 401 Unauthorized)", "mismatch");
      setBruteForceProgress(100);
      await sleep(350);

      addLog("AUTHENTICATION ATTEMPT -> RATE LIMIT -> REQUEST BLOCKED", "rate_limit");
      addLog("RATE LIMIT TRIGGERED: TOO MANY ATTEMPTS (HTTP 429)", "rate_limit");
      await sleep(250);

      addLog("FAILED ATTEMPTS: 5 / 5 -> ACCOUNT LOCKOUT: ACTIVE (15 MINUTES)", "lockout");
      addLog("> AUTOMATED CANDIDATE SCAN TERMINATED BY SERVER DEFENSES", "blocked");
      setBruteForceStatus("PROTECTED_BLOCKED");
    }
  };

  const resetSyntheticBruteForceDemo = () => {
    setBruteForceStatus("IDLE");
    setBruteForceProgress(0);
    setBruteForceLogs([]);
  };

  // --- SECTION 6: ARCHITECTURE & LAYERS STATE ---
  const [expandedLayer, setExpandedLayer] = useState<number | null>(1);

  // ----------------------------------------------------
  // Initial Synthetic Session Generation
  // ----------------------------------------------------
  const generateSyntheticSession = async () => {
    setIsGeneratingSession(true);
    try {
      const rawBytes = new Uint8Array(32);
      if (typeof window !== "undefined" && window.crypto) {
        window.crypto.getRandomValues(rawBytes);
      }
      const rawTokenHex = Array.from(rawBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // SHA-256 Hash of Token
      const encoder = new TextEncoder();
      const digestBuffer = await window.crypto.subtle.digest("SHA-256", encoder.encode(rawTokenHex));
      const hashHex = Array.from(new Uint8Array(digestBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      setSessionRawToken(rawTokenHex);
      setSessionHashedToken(hashHex);
    } catch (err) {
      console.error("Session token simulation error:", err);
    } finally {
      setIsGeneratingSession(false);
    }
  };

  useEffect(() => {
    generateSyntheticSession();
    handleSanitizeAuditPayload();
  }, []);

  // ----------------------------------------------------
  // 01 — Hashing & Verification Handlers
  // ----------------------------------------------------
  const handleRunHashDemo = async () => {
    try {
      setIsHashing(true);
      setHashError(null);
      setVerifyResult(null);

      const res = await fetch("/api/admin/security/hash-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hash", samplePassword }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate Argon2id hash");
      setHashData(json);
      setCandidatePassword(samplePassword); // Pre-fill candidate
    } catch (err: any) {
      setHashError(err.message || "Failed to compute Argon2id hash");
    } finally {
      setIsHashing(false);
    }
  };

  const handleRunVerifyDemo = async () => {
    if (!hashData?.hashResult) {
      setVerifyError("Please generate a synthetic hash first before testing verification.");
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyError(null);

      const res = await fetch("/api/admin/security/hash-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          candidatePassword,
          hashToVerify: hashData.hashResult,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to verify password");
      setVerifyResult(json);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify password");
    } finally {
      setIsVerifying(false);
    }
  };

  // ----------------------------------------------------
  // 02 — Lockout Simulator Handlers (Memory Only)
  // ----------------------------------------------------
  const handleSimulateFailedAttempt = () => {
    const now = new Date();
    if (simLockedUntil && simLockedUntil > now) {
      setSimLog((prev) => [
        {
          text: `[REJECTED - 429] Authentication blocked by active temporary lockout. Account locked until ${simLockedUntil.toLocaleTimeString()}.`,
          type: "lock",
        },
        ...prev,
      ]);
      return;
    }

    const nextCount = (simLockedUntil && simLockedUntil <= now ? 0 : simAttempts) + 1;
    if (nextCount >= 5) {
      const lockExpiry = new Date(now.getTime() + 15 * 60 * 1000);
      setSimAttempts(5);
      setSimLockedUntil(lockExpiry);
      setSimLog((prev) => [
        {
          text: `[LOCKOUT ENFORCED] Attempt 5/5 failed. ACCOUNT TEMPORARILY LOCKED for 15 minutes (until ${lockExpiry.toLocaleTimeString()}). HTTP 429 returned.`,
          type: "lock",
        },
        ...prev,
      ]);
    } else {
      setSimAttempts(nextCount);
      setSimLog((prev) => [
        {
          text: `[FAILURE RECORDED] Attempt ${nextCount}/5 failed. HTTP 401 Unauthorized. (${5 - nextCount} attempt${
            5 - nextCount === 1 ? "" : "s"
          } remaining before temporary lockout).`,
          type: "fail",
        },
        ...prev,
      ]);
    }
  };

  const handleSimulateSuccessfulLogin = () => {
    const now = new Date();
    if (simLockedUntil && simLockedUntil > now) {
      setSimLog((prev) => [
        {
          text: `[LOGIN BLOCKED] Account is currently in 15-minute temporary lockout. Valid credentials cannot bypass lockout.`,
          type: "lock",
        },
        ...prev,
      ]);
      return;
    }

    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog((prev) => [
      {
        text: `[SUCCESS] Authentication verified via Argon2id. Failed attempts counter reset to 0. Session token issued.`,
        type: "success",
      },
      ...prev,
    ]);
  };

  const handleSimulateAdminUnlock = () => {
    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog((prev) => [
      {
        text: `[ADMIN UNLOCK] Administrator reset failed attempts to 0 and cleared lockedUntil timestamp. Account status: ACTIVE.`,
        type: "unlock",
      },
      ...prev,
    ]);
  };

  const handleResetLockoutSimulator = () => {
    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog([]);
  };

  // ----------------------------------------------------
  // 04 — Audit Sanitization Handler
  // ----------------------------------------------------
  const handleSanitizeAuditPayload = (customText?: string) => {
    try {
      const textToParse = customText ?? auditPayloadText;
      const parsed = JSON.parse(textToParse);
      const sanitized = sanitizeMetadata(parsed);
      setSanitizedOutput(sanitized || null);
    } catch {
      // Invalid JSON syntax handled in UI
      setSanitizedOutput(null);
    }
  };

  // ----------------------------------------------------
  // 05 — E2EE Sandbox Handler
  // ----------------------------------------------------
  const handleRunE2eeSimulation = async () => {
    setIsE2eeRunning(true);
    try {
      // 1. Generate synthetic key pairs for Alice & Bob
      const aliceKeys = await generateUserKeyPair();
      const bobKeys = await generateUserKeyPair();

      const alicePubJwk = await exportPublicKey(aliceKeys.publicKey);
      const bobPubJwk = await exportPublicKey(bobKeys.publicKey);

      // 2. Derive shared AES-256-GCM key
      const aliceSharedKey = await deriveSharedAesKey(aliceKeys.privateKey, bobKeys.publicKey);
      const bobSharedKey = await deriveSharedAesKey(bobKeys.privateKey, aliceKeys.publicKey);

      // 3. Encrypt message on Alice's client
      const ciphertextJson = await encryptMessage(e2eePlaintext, aliceSharedKey);
      const parsed = JSON.parse(ciphertextJson);

      // 4. Decrypt message on Bob's client
      const decrypted = await decryptMessage(ciphertextJson, bobSharedKey);

      // 5. Test Tamper Detection: flip 1 character in ciphertext
      let tampered = parsed.ct;
      const charToFlip = tampered.charAt(tampered.length - 2) === "A" ? "B" : "A";
      tampered = tampered.slice(0, -2) + charToFlip + tampered.slice(-1);
      const tamperedPayload = JSON.stringify({ ...parsed, ct: tampered });

      let tamperErr: string | null = null;
      let tamperPassed = false;
      try {
        await decryptMessage(tamperedPayload, bobSharedKey);
        tamperErr = "UNEXPECTED FAILURE: Tampered ciphertext was decrypted without throwing an authentication tag mismatch error.";
        tamperPassed = false;
      } catch {
        tamperErr = "Tampering detected successfully. AES-GCM authentication rejected the modified message.";
        tamperPassed = true;
      }

      setE2eeState({
        alicePublicJwk: JSON.stringify(JSON.parse(alicePubJwk), null, 2),
        bobPublicJwk: JSON.stringify(JSON.parse(bobPubJwk), null, 2),
        sharedSecretHex: "256-bit AES-GCM Key derived via ECDH (NIST P-256) + HKDF-SHA-256",
        ivBase64: parsed.iv,
        ciphertextBase64: parsed.ct,
        fullCiphertextPayload: JSON.stringify(parsed, null, 2),
        decryptedPlaintext: decrypted,
        tamperedCiphertext: tampered,
        tamperError: tamperErr,
        tamperPassed,
      });
    } catch (err) {
      console.error("E2EE demo execution error:", err);
    } finally {
      setIsE2eeRunning(false);
    }
  };

  // ----------------------------------------------------
  // Global Lab Reset (Strictly in-memory, ZERO DB Writes)
  // ----------------------------------------------------
  const handleResetLab = () => {
    setSamplePassword("ExamplePassword123!");
    setHashData(null);
    setHashError(null);
    setCandidatePassword("ExamplePassword123!");
    setVerifyResult(null);
    setVerifyError(null);
    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog([]);
    setE2eePlaintext("Confidential message protected by Instagramer E2EE.");
    setE2eeState(null);
    setExpandedLayer(1);
    resetSyntheticBruteForceDemo();
    generateSyntheticSession();
    handleSanitizeAuditPayload();
  };

  // Presentation Slides Definition
  const presentationSlides = [
    {
      title: "01. Password Hashing with Argon2id",
      category: "AUTHENTICATION & KEY DERIVATION",
      description:
        "Instagramer secures all user credentials using Argon2id (RFC 9106), the OWASP-recommended memory-hard key derivation function. Passwords are never stored or logged in plain text.",
      highlights: [
        "Memory Cost: 64 MB (65,536 KiB) per hash calculation renders GPU/ASIC parallel cracking clusters cost-prohibitive.",
        "Time Cost: 3 iterations multiplies required CPU cycles per pre-image candidate.",
        "One-Way Verification: Authenticates passwords by re-computing and comparing the cryptographic digest without ever decrypting.",
      ],
    },
    {
      title: "02. Temporary Account Lockout & Brute-Force Defense",
      category: "THREAT MITIGATION",
      description:
        "To mitigate automated online dictionary and credential-stuffing attacks, Instagramer enforces automated account lockout backed by PostgreSQL tracking.",
      highlights: [
        "5 Failed Attempts Threshold: Triggers a 15-minute temporary lockout window.",
        "Non-Permanent Lockout: Protects legitimate users from permanent Denial of Service (DoS) attacks.",
        "Administrative Override: Administrators can review locked accounts and safely reset lockout status in real time.",
      ],
    },
    {
      title: "03. Session Security & Token Hashing",
      category: "SESSION MANAGEMENT",
      description:
        "Instagramer decouples client authentication cookies from server-side database storage via SHA-256 token hashing.",
      highlights: [
        "Cryptographically Secure 32-Byte Tokens: Generated via high-entropy CSPRNG.",
        "Database Token Hashing: The database stores only the SHA-256 digest. Database breach leaves active cookies uncompromised.",
        "Hardened Cookie Flags: HttpOnly (blocks XSS theft), SameSite=Lax (mitigates CSRF), Secure (TLS encrypted transport).",
      ],
    },
    {
      title: "04. Immutable Audit Logging & Zero Secret Policy",
      category: "OBSERVABILITY & COMPLIANCE",
      description:
        "All security-relevant actions (logins, lockouts, role modifications, E2EE key registrations) are recorded in an immutable audit trail with automatic secret sanitization.",
      highlights: [
        "Automatic Secret Redaction: Passwords, session tokens, API keys, and private keys are replaced with [REDACTED].",
        "Deterministic Sanitization: Protects sensitive data while preserving forensic metadata (actorId, timestamp, action, IP).",
        "Audit Trail Integrity: Administrators can review chronological activity without compromising user privacy.",
      ],
    },
    {
      title: "05. End-to-End Encryption Privacy Boundary",
      category: "CRYPTOGRAPHIC PRIVACY",
      description:
        "Direct messages utilize client-side End-to-End Encryption with ECDH NIST P-256 key agreement and AES-256-GCM authenticated encryption.",
      highlights: [
        "Zero Plaintext Server Policy: The server and database store strictly ciphertext payloads (iv, ct).",
        "Private Keys Stay on Client: Private keys are never transmitted over the network or stored in the database.",
        "AES-GCM Authenticated Encryption: Detects any unauthorized bit modification or payload tampering in transit.",
      ],
    },
    {
      title: "06. Administrator Privacy & Authority Boundary",
      category: "ACCESS CONTROL",
      description:
        "Instagramer enforces strict least-privilege role boundaries between administrative operations and private user cryptographic boundaries.",
      highlights: [
        "Admins CAN: Moderate public posts, manage user roles, review abuse reports, and inspect security telemetry.",
        "Admins CANNOT: Read private keys, decrypt E2EE messages, view plaintext passwords, or intercept conversations.",
        "Cryptographic Enforcement: Privacy is mathematically guaranteed by the architecture, not just administrative policy.",
      ],
    },
    {
      title: "07. Seven-Layer Defense-in-Depth Architecture",
      category: "SECURITY ARCHITECTURE",
      description:
        "A holistic defense strategy ensuring that no single component failure compromises the overall application security.",
      highlights: [
        "Layer 1: Strict Input Validation & Type Safety",
        "Layer 2: Argon2id Memory-Hard Password Hashing",
        "Layer 3: 5-Attempt / 15-Minute Account Lockout",
        "Layer 4: SHA-256 Hashed Session Tokens & HttpOnly Cookies",
        "Layer 5: Server-Side RBAC Gatekeeper (requireAdmin, requireRole)",
        "Layer 6: Sanitized Immutable Audit Logging",
        "Layer 7: Client-Side E2EE Zero-Plaintext Boundary",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/security"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Security Center
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5 mt-1.5">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
            SECURITY LABORATORY
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Understand how Instagramer protects accounts, sessions, messages, and administrative actions. Interactive technical simulation for classroom demonstration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            variant="outline"
            className="border-emerald-700/80 bg-emerald-950/60 text-emerald-300 text-xs px-3 py-1 font-mono flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ● SIMULATION MODE
          </Badge>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 flex items-center gap-1.5"
          >
            <Tv className="h-3.5 w-3.5 text-indigo-400" />
            {isPresentationMode ? "Exit Presentation Mode" : "Start Presentation"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetLab}
            className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5"
            title="Resets memory state only. Zero database interaction."
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            Reset Lab
          </Button>
        </div>
      </div>

      {/* Safety & Educational Isolation Notice */}
      <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 p-4 text-xs text-indigo-200 flex items-start gap-3.5 shadow-sm">
        <Cpu className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-100">EDUCATIONAL DEMONSTRATION & PRODUCTION ISOLATION:</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/60">
              Zero Database Writes
            </span>
          </div>
          <p className="text-indigo-300/90 text-[11px] leading-relaxed">
            This laboratory executes isolated cryptographic computations on synthetic sample data in memory. It does not access, reveal, or persist real user credentials, and does not alter production authentication state or PostgreSQL data.
          </p>
        </div>
      </div>

      {/* Presentation Mode Slide Deck */}
      {isPresentationMode && (
        <Card className="border-indigo-700 bg-slate-900/95 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-5 w-5 text-indigo-400" />
                <span className="text-xs font-mono uppercase text-indigo-300 tracking-wider">
                  Classroom Presentation View — Slide {currentSlideIndex + 1} of {presentationSlides.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-mono text-slate-400">
                  {currentSlideIndex + 1} / {presentationSlides.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(presentationSlides.length - 1, prev + 1))}
                  disabled={currentSlideIndex === presentationSlides.length - 1}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsPresentationMode(false)}
                  className="h-7 text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 ml-2"
                >
                  Close Deck
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <Badge variant="outline" className="border-indigo-800 bg-indigo-950/60 text-indigo-300 text-[10px]">
                {presentationSlides[currentSlideIndex].category}
              </Badge>
              <h2 className="text-xl font-bold text-slate-100">{presentationSlides[currentSlideIndex].title}</h2>
              <p className="text-sm text-slate-300 leading-relaxed pt-1">
                {presentationSlides[currentSlideIndex].description}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                Key Architectural Highlights:
              </span>
              <ul className="space-y-2 text-xs text-slate-200">
                {presentationSlides[currentSlideIndex].highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Slide Quick Navigation Jump */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {presentationSlides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    currentSlideIndex === idx
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {idx + 1}. {s.title.split(". ")[1] || s.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "all", label: "All Modules" },
          { id: "00-bruteforce", label: "00 — Synthetic Argon2id Brute-Force" },
          { id: "01-hashing", label: "01 — Password Hashing" },
          { id: "02-lockout", label: "02 — Account Lockout" },
          { id: "03-session", label: "03 — Session Security" },
          { id: "04-audit", label: "04 — Audit Logging" },
          { id: "05-e2ee", label: "05 — E2EE Privacy Boundary" },
          { id: "06-arch", label: "06 — Security Architecture" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === tab.id
                ? "bg-slate-800 text-indigo-400 font-semibold border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Security Status Panel */}
      <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
        <CardHeader className="py-3 px-5 border-b border-slate-800">
          <CardTitle className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Live Security Configuration Status
            </span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Production Defenses Active
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Password Hashing</span>
            <span className="font-mono text-emerald-400 font-semibold block mt-0.5">Argon2id (64MB)</span>
            <span className="text-[9px] text-slate-500">RFC 9106 Standard</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Account Lockout</span>
            <span className="font-mono text-emerald-400 font-semibold block mt-0.5">5 Attempts / 15m</span>
            <span className="text-[9px] text-slate-500">PostgreSQL Tracked</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Session Protection</span>
            <span className="font-mono text-emerald-400 font-semibold block mt-0.5">SHA-256 Hashed</span>
            <span className="text-[9px] text-slate-500">HttpOnly / 24h TTL</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Audit Logging</span>
            <span className="font-mono text-emerald-400 font-semibold block mt-0.5">Auto-Sanitized</span>
            <span className="text-[9px] text-slate-500">Zero Plaintext Secrets</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">E2EE Boundary</span>
            <span className="font-mono text-emerald-400 font-semibold block mt-0.5">P-256 + AES-GCM</span>
            <span className="text-[9px] text-slate-500">Client-Side Only</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Admin Authorization</span>
            <span className="font-mono text-emerald-400 font-semibold block mt-0.5">Server RBAC</span>
            <span className="text-[9px] text-slate-500">requireAdmin() Gated</span>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 00: SYNTHETIC ARGON2ID BRUTE-FORCE & PROTECTED MODE DEMO */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "00-bruteforce") && (
        <Card className="border-slate-800 bg-slate-950 text-slate-100 shadow-md">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-mono font-bold flex items-center gap-2 text-cyan-400">
                <Terminal className="h-5 w-5 text-cyan-400 animate-pulse" />
                00 — SYNTHETIC ARGON2ID BRUTE-FORCE & PROTECTED MODE DEMONSTRATION
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    bruteForceMode === "SIMULATED_VULNERABLE"
                      ? "border-amber-700 bg-amber-950/60 text-amber-400"
                      : "border-emerald-700 bg-emerald-950/60 text-emerald-400"
                  }`}
                >
                  {bruteForceMode === "SIMULATED_VULNERABLE" ? "● SIMULATED VULNERABLE STATE" : "● SIMULATED PROTECTED STATE"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Offline educational candidate testing visualization on a 6-digit synthetic target account.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {/* Safety & Isolation Technical Boundary Labels */}
            <div className="rounded-xl border border-amber-800/80 bg-amber-950/20 p-3 text-xs text-amber-300 font-mono space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-amber-700 text-amber-300 text-[9px] uppercase font-bold">
                  OFFLINE SYNTHETIC EDUCATIONAL SIMULATION
                </Badge>
                <span className="text-[10px] text-amber-400/90 font-bold">
                  NOT AN ATTACK AGAINST /api/auth/login
                </span>
                <span className="text-[10px] text-amber-400/90 font-bold">
                  ● NOT A SEARCH AGAINST A REAL NEON PASSWORD HASH
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                The demonstration target candidate (<strong>482915</strong>) and hash are generated strictly in browser memory. This demonstration never invokes `/api/auth/login` or queries Neon PostgreSQL user hashes.
              </p>
            </div>

            {/* Simulation Telemetry & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">TARGET</span>
                <span className="text-slate-200 font-bold block">SYNTHETIC CLASSROOM ACCOUNT</span>
                <span className="text-[9px] text-indigo-400">@student_demo_01</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">FORMAT</span>
                <span className="text-amber-400 font-bold block">6 DIGIT NUMERIC</span>
                <span className="text-[9px] text-slate-400">Candidate: {SYNTHETIC_TARGET_PASSWORD}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">SEARCH SPACE</span>
                <span className="text-cyan-400 font-bold block">1,000,000 POSSIBILITIES</span>
                <span className="text-[9px] text-slate-400">000000 — 999999</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">SIMULATION MODE</span>
                <select
                  value={bruteForceMode}
                  onChange={(e) => {
                    setBruteForceMode(e.target.value as any);
                    resetSyntheticBruteForceDemo();
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 rounded p-1 focus:outline-none"
                >
                  <option value="SIMULATED_VULNERABLE">SIMULATED VULNERABLE STATE</option>
                  <option value="SIMULATED_PROTECTED">SIMULATED PROTECTED STATE</option>
                </select>
              </div>
            </div>

            {/* Simulation Trigger Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] font-mono text-slate-400">
                Status:{" "}
                <span
                  className={
                    bruteForceStatus === "RUNNING"
                      ? "text-amber-400 font-bold"
                      : bruteForceStatus === "MATCH_FOUND"
                      ? "text-emerald-400 font-bold"
                      : bruteForceStatus === "PROTECTED_BLOCKED"
                      ? "text-red-400 font-bold"
                      : "text-slate-400"
                  }
                >
                  {bruteForceStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={runSyntheticBruteForceDemo}
                  disabled={bruteForceStatus === "RUNNING"}
                  className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs px-4 flex items-center gap-1.5"
                >
                  {bruteForceStatus === "RUNNING" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 fill-current" />
                  )}
                  {bruteForceStatus === "RUNNING" ? "SIMULATING..." : "[ START BRUTE-FORCE SIMULATION ]"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetSyntheticBruteForceDemo}
                  disabled={bruteForceStatus === "RUNNING"}
                  className="border-slate-700 bg-slate-900 text-slate-300 text-xs font-mono"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Cinematic Hacker Terminal Window */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Terminal className="h-3.5 w-3.5" /> SYNTHETIC_VERIFICATION_TERMINAL v2.4
                </span>
                <span>SEARCH SPACE PROGRESS: {Math.round(bruteForceProgress)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    bruteForceStatus === "MATCH_FOUND"
                      ? "bg-emerald-500"
                      : bruteForceStatus === "PROTECTED_BLOCKED"
                      ? "bg-red-500"
                      : "bg-cyan-400"
                  }`}
                  style={{ width: `${bruteForceProgress}%` }}
                />
              </div>

              {/* Console Logs Display */}
              <div className="space-y-1 max-h-56 overflow-y-auto pt-2 text-[11px] leading-relaxed">
                {bruteForceLogs.length === 0 ? (
                  <div className="text-slate-600 text-center py-6">
                    [ TERMINAL IDLE — Click START BRUTE-FORCE SIMULATION to initiate classroom candidate testing ]
                  </div>
                ) : (
                  bruteForceLogs.map((log) => (
                    <div
                      key={log.id}
                      className={
                        log.type === "info"
                          ? "text-cyan-300 font-bold"
                          : log.type === "mismatch"
                          ? "text-slate-400"
                          : log.type === "match"
                          ? "text-emerald-400 font-bold bg-emerald-950/40 p-1 rounded"
                          : log.type === "rate_limit"
                          ? "text-amber-400 font-bold"
                          : log.type === "lockout"
                          ? "text-red-400 font-bold bg-red-950/40 p-1 rounded"
                          : "text-red-300"
                      }
                    >
                      {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Argon2id Conceptual Explanation Panel (HASHING ≠ ENCRYPTION) */}
            <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/50 pb-2">
                <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-400" /> HASHING ≠ ENCRYPTION
                </span>
                <Badge variant="outline" className="border-indigo-700 bg-indigo-950 text-indigo-300 text-[9px] font-mono">
                  ARGON2ID CONCEPTUAL EXPLANATION
                </Badge>
              </div>

              {/* Diagrams */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Flow 1: Password Storage */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 block font-bold">1. PASSWORD STORAGE PIPELINE:</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">PASSWORD</span>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="px-2 py-1 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">ARGON2ID</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">STORED HASH</span>
                  </div>
                </div>

                {/* Flow 2: Candidate Verification */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 block font-bold">2. CANDIDATE VERIFICATION PIPELINE:</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">CANDIDATE</span>
                    <ArrowRight className="h-3 w-3 text-indigo-400" />
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">ARGON2ID</span>
                    <ArrowRight className="h-3 w-3 text-amber-400" />
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">COMPARE</span>
                    <ArrowRight className="h-3 w-3 text-emerald-400" />
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">MATCH / MISMATCH</span>
                  </div>
                </div>
              </div>

              {/* Technical Principles */}
              <div className="text-[11px] text-slate-300 leading-relaxed font-mono space-y-1.5 pt-1">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>HASHING CANNOT SIMPLY BE "DECRYPTED":</strong> Argon2id is a one-way mathematical function. An attacker who obtains a password hash cannot mathematically invert or decrypt it to recover the original password.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>PASSWORD GUESSING REQUIRES TESTING CANDIDATES:</strong> Authentication and password cracking both rely on hashing candidate passwords and comparing candidate digests against stored hashes.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>DEFENSE IN DEPTH:</strong> Argon2id memory-hardness (64 MB RAM per hash) makes offline candidate guessing expensive, while server-side Rate Limiting + Account Lockout render online dictionary attacks impossible.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 01: PASSWORD HASHING & DECOMPOSITION & VERIFICATION */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "01-hashing") && (
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-400" />
                01 — Password Hashing & Verification Laboratory
              </CardTitle>
              <Badge variant="outline" className="border-indigo-800 text-indigo-300 bg-indigo-950/40 text-[10px] w-fit">
                Argon2id (m=64MB, t=3, p=1)
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Explore how Argon2id transforms synthetic plaintext passwords into memory-hard hashes and performs one-way cryptographic verification.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Subsection 1.1: Interactive Hash Generation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Step 1: Input Synthetic Plaintext Password
                </label>
                <div className="flex gap-1 text-[11px]">
                  <span className="text-slate-500">Presets:</span>
                  <button
                    onClick={() => setSamplePassword("ExamplePassword123!")}
                    className="text-indigo-400 hover:underline px-1"
                  >
                    ExamplePassword123!
                  </button>
                  <button
                    onClick={() => setSamplePassword("ClassroomSec#2026")}
                    className="text-indigo-400 hover:underline px-1"
                  >
                    ClassroomSec#2026
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={samplePassword}
                  onChange={(e) => setSamplePassword(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="Type synthetic password..."
                />
                <Button
                  onClick={handleRunHashDemo}
                  disabled={!samplePassword.trim() || isHashing}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 shrink-0"
                >
                  {isHashing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Flame className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  Compute Argon2id Hash
                </Button>
              </div>

              {hashError && (
                <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-xs text-red-300">
                  {hashError}
                </div>
              )}
            </div>

            {/* Transformation Flow Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] font-mono font-semibold text-slate-400 block mb-1">PLAINTEXT (INPUT)</span>
                <p className="text-xs font-mono text-emerald-400 truncate font-bold">
                  "{samplePassword || "ExamplePassword123!"}"
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">In-memory synthetic string</span>
              </div>
              <div className="flex items-center justify-center p-2">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-indigo-400 mb-1">
                    ARGON2ID (m=64MB, t=3, p=1)
                  </span>
                  <ArrowRight className="h-5 w-5 text-indigo-400" />
                  <span className="text-[9px] text-slate-500 mt-1">Key Derivation Function</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] font-mono font-semibold text-slate-400 block mb-1">
                  HASH (DATABASE STORAGE)
                </span>
                <p className="text-xs font-mono text-amber-400 truncate">
                  {hashData ? hashData.hashResult.substring(0, 24) + "..." : "$argon2id$v=19$m=65536..."}
                </p>
                <span className="text-[10px] text-emerald-400 mt-1 block">Stored in User.passwordHash</span>
              </div>
            </div>

            {/* Subsection 1.2: Hash Decomposition & Cryptographic Parameters */}
            {hashData && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-amber-400" />
                    Computed Argon2id Encoded String:
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Time Elapsed: <strong className="text-indigo-300">{hashData.telemetry.computationTimeMs} ms</strong>
                  </span>
                </div>

                <pre className="rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-amber-300 overflow-x-auto border border-slate-800 select-all">
                  {hashData.hashResult}
                </pre>

                {/* Hash Decomposition Sections */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Argon2id Hash Parameter Decomposition:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">Algorithm & Type</span>
                        <Badge variant="outline" className="text-[9px] border-indigo-800 text-indigo-300">
                          $argon2id$
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Argon2id combines Argon2d (data-dependent) and Argon2i (data-independent) to resist both GPU cracking and side-channel timing attacks.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">Memory Cost (m=65536)</span>
                        <Badge variant="outline" className="text-[9px] border-emerald-800 text-emerald-300">
                          64 MB RAM
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Allocates 64 MB of dedicated RAM per hash evaluation. Makes mass parallel password cracking on GPU/ASIC farms economically unfeasible.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">Time Cost (t=3)</span>
                        <Badge variant="outline" className="text-[9px] border-amber-800 text-amber-300">
                          3 Iterations
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Executes 3 sequential computational passes through memory, tuning server response latency against brute-force resistance.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">Parallelism (p=1)</span>
                        <Badge variant="outline" className="text-[9px] border-blue-800 text-blue-300">
                          1 Thread
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Specifies 1 thread execution, optimal for standard Node.js server thread pool utilization.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">Cryptographic Salt</span>
                        <Badge variant="outline" className="text-[9px] border-purple-800 text-purple-300">
                          16-Byte CSPRNG
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-purple-300 truncate">
                        {hashData.telemetry.saltExtracted}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Unique per user. Renders pre-computed rainbow table lookup attacks ineffective.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">Output Hash Digest</span>
                        <Badge variant="outline" className="text-[9px] border-rose-800 text-rose-300">
                          32-Byte Digest
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-amber-300 truncate">
                        {hashData.telemetry.digestExtracted}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        The raw one-way cryptographic output compared during authentication.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subsection 1.3: Hash Verification Demo */}
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Step 2: Interactive Hash Verification Demonstration
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Memory Verification Only</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Test how the server verifies authentication without ever decrypting the stored hash:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400">Original Hashed Password:</span>
                      <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-mono text-slate-300 border border-slate-800">
                        {hashData.syntheticInput}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400">Candidate Password To Verify:</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={candidatePassword}
                          onChange={(e) => setCandidatePassword(e.target.value)}
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                          placeholder="Type candidate password..."
                        />
                        <Button
                          size="sm"
                          onClick={handleRunVerifyDemo}
                          disabled={isVerifying}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3"
                        >
                          {isVerifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {verifyError && (
                    <div className="rounded-lg border border-red-800 bg-red-950/50 p-2.5 text-xs text-red-300">
                      {verifyError}
                    </div>
                  )}

                  {verifyResult && (
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
                        verifyResult.matched
                          ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                          : "border-red-800 bg-red-950/40 text-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {verifyResult.matched ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-sm block">
                            {verifyResult.matched ? "✓ MATCH: Verification Succeeded" : "✕ NO MATCH: Verification Failed"}
                          </span>
                          <span className="text-[11px] opacity-90">{verifyResult.message}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] opacity-75">
                        {verifyResult.computationTimeMs} ms
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Educational Note: Why Hashing is One-Way */}
            <div className="rounded-xl bg-slate-950/80 p-3.5 text-xs text-slate-300 border border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-400" />
                Why Hashing is One-Way (Pre-Image Resistance):
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The application does not decrypt the stored hash to authenticate the user. Instead, the supplied candidate password is re-hashed using the public parameters (salt, memory cost, iterations) encoded in the hash string. If the resulting output digest matches the stored hash, authentication succeeds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 02: ACCOUNT LOCKOUT SIMULATOR */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "02-lockout") && (
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-400" />
                02 — Brute-Force Account Lockout Simulator
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-xs w-fit ${
                  simLockedUntil && simLockedUntil > new Date()
                    ? "border-red-800 bg-red-950/60 text-red-400 font-bold"
                    : simAttempts > 0
                    ? "border-amber-800 bg-amber-950/60 text-amber-400"
                    : "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                }`}
              >
                {simLockedUntil && simLockedUntil > new Date()
                  ? "ACCOUNT TEMPORARILY LOCKED (15 MIN)"
                  : `${simAttempts} / 5 Failed Attempts`}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulate brute-force authentication failures, threshold lockout enforcement (5 attempts), and administrative unlock lifecycle.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Visual 5-Attempt Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Failed Attempts Progress (Lockout Threshold: 5)</span>
                <span className="font-mono font-bold">
                  {simAttempts >= 5 ? "100% (LOCKED - HTTP 429)" : `${simAttempts * 20}% (${simAttempts}/5)`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((slot) => {
                  const isFilled = simAttempts >= slot;
                  const isFinal = slot === 5;
                  return (
                    <div
                      key={slot}
                      className={`h-10 rounded-xl flex flex-col items-center justify-center font-mono text-xs font-bold transition-all ${
                        isFilled
                          ? isFinal
                            ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                            : "bg-amber-600 text-white"
                          : "bg-slate-950 border border-slate-800 text-slate-500"
                      }`}
                    >
                      <span>Attempt {slot}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {isFilled ? (isFinal ? "LOCKOUT" : "FAIL") : "READY"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                size="sm"
                onClick={handleSimulateFailedAttempt}
                className="bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 text-xs flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                Simulate Failed Login (+1)
              </Button>

              <Button
                size="sm"
                onClick={handleSimulateSuccessfulLogin}
                className="bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Simulate Successful Login (Reset)
              </Button>

              <Button
                size="sm"
                onClick={handleSimulateAdminUnlock}
                disabled={simAttempts === 0 && !simLockedUntil}
                className="bg-blue-950 border border-blue-800 text-blue-300 hover:bg-blue-900 text-xs flex items-center gap-1.5"
              >
                <Unlock className="h-3.5 w-3.5 text-blue-400" />
                Simulate Admin Unlock
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleResetLockoutSimulator}
                className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 ml-auto"
              >
                Reset Simulation
              </Button>
            </div>

            {/* Lockout Timeline Diagram */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block font-mono">
                Lockout Lifecycle Flowchart:
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">
                  Login Failure
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">
                  Attempt Counter (1..4)
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                <span className="px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-amber-300">
                  5 Failed Attempts
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-red-400" />
                <span className="px-2.5 py-1 rounded bg-red-950 border border-red-800 text-red-300 font-bold">
                  Temporary Lockout (15 min)
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  Lockout Expires / Admin Reset
                </span>
              </div>
            </div>

            {/* Simulation Event Log */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Simulation Event Trail:</span>
              <div className="rounded-xl bg-slate-950 p-3 max-h-40 overflow-y-auto border border-slate-800 space-y-1 font-mono text-xs">
                {simLog.length === 0 ? (
                  <div className="text-slate-500 text-[11px] text-center py-2">
                    No events yet. Click buttons above to trigger failure/success simulation.
                  </div>
                ) : (
                  simLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`text-[11px] py-1 border-b border-slate-900 last:border-0 ${
                        entry.type === "lock"
                          ? "text-red-400 font-semibold"
                          : entry.type === "fail"
                          ? "text-amber-400"
                          : entry.type === "success"
                          ? "text-emerald-400 font-semibold"
                          : "text-blue-400 font-semibold"
                      }`}
                    >
                      {entry.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 03: SESSION SECURITY DEMONSTRATION */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "03-session") && (
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cookie className="h-5 w-5 text-emerald-400" />
                03 — Session Security & Cookie Protection Laboratory
              </CardTitle>
              <Badge variant="outline" className="border-emerald-800 text-emerald-300 bg-emerald-950/40 text-[10px] w-fit">
                SHA-256 Hashed Tokens
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates how Instagramer issues high-entropy 32-byte session tokens to browsers while storing strictly SHA-256 digests in PostgreSQL.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Session Security Architecture Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cookie className="h-4 w-4 text-emerald-400" />
                    Browser Client View (HTTP-only Cookie)
                  </span>
                  <Badge variant="outline" className="text-[10px] border-emerald-800 text-emerald-400">
                    Client Storage
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  The client browser holds the raw 32-byte (64-character hex) random token transmitted exclusively via secure HTTP-only cookies:
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                  {sessionRawToken || "Generating synthetic token..."}
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300">Cookie Hardening Parameters:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    <li><strong className="text-emerald-300">HttpOnly: true</strong> — JavaScript cannot access document.cookie (XSS immune).</li>
                    <li><strong className="text-emerald-300">SameSite: Lax</strong> — Reduces unwanted cross-site request behavior (CSRF).</li>
                    <li><strong className="text-emerald-300">Secure: true</strong> — Cookie is transmitted exclusively over HTTPS in production.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-amber-400" />
                    PostgreSQL Session Table View
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-800 text-amber-400">
                    Database Storage
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  The database stores strictly the <strong>SHA-256 digest</strong> of the token. Raw session tokens are NEVER written to disk:
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                  {sessionHashedToken || "Computing SHA-256 digest..."}
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300">Database Breach Resistance:</span>
                  <p className="text-slate-400 leading-relaxed">
                    Even if an attacker gains unauthorized read access to PostgreSQL, the active session tokens cannot be derived from the SHA-256 digests. Active sessions cannot be hijacked.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Token Generation Button */}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={generateSyntheticSession}
                disabled={isGeneratingSession}
                className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingSession ? "animate-spin" : ""}`} />
                Generate New Synthetic Session Token
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 04: AUDIT LOGGING & SANITIZATION */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "04-audit") && (
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                04 — Audit Logging & Secret Sanitization Laboratory
              </CardTitle>
              <Badge variant="outline" className="border-blue-800 text-blue-300 bg-blue-950/40 text-[10px] w-fit">
                Zero Secret Policy
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify how Instagramer's SecurityAuditService intercepts and redacts passwords, session tokens, and cryptographic keys before writing audit logs.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Raw Metadata */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Raw Event Payload (In Memory):</span>
                  <span className="text-[10px] text-red-400 font-mono">Contains Sensitive Keys</span>
                </div>
                <textarea
                  value={auditPayloadText}
                  onChange={(e) => {
                    setAuditPayloadText(e.target.value);
                    handleSanitizeAuditPayload(e.target.value);
                  }}
                  rows={10}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Paste JSON payload..."
                />
              </div>

              {/* Sanitized Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Sanitized Output (AuditLog.metadata):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Clean / Redacted</span>
                </div>
                <pre className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[200px]">
                  {sanitizedOutput ? JSON.stringify(sanitizedOutput, null, 2) : "Invalid JSON input"}
                </pre>
              </div>
            </div>

            {/* Redacted Keys Checklist */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block font-mono">
                Redacted Secret Patterns:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                {[
                  "password",
                  "sessionToken",
                  "apiKey",
                  "privateKey",
                  "secret",
                  "authorization",
                  "bearer",
                  "access_token",
                  "database_url",
                ].map((key) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-300 text-[10px]"
                  >
                    {key} → [REDACTED]
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 05: E2EE PRIVACY BOUNDARY & ADMIN BOUNDARY */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "05-e2ee") && (
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                05 — End-to-End Encryption & Privacy Boundary Laboratory
              </CardTitle>
              <Badge variant="outline" className="border-purple-800 text-purple-300 bg-purple-950/40 text-[10px] w-fit">
                ECDH P-256 + AES-256-GCM
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify client-side key agreement, authenticated AES-256-GCM encryption, tamper detection, and the strict administrator privacy boundary.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* E2EE Architecture Pipeline */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-200 block font-mono">
                E2EE Cryptographic Flow:
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                  Sender Device (Plaintext)
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
                <span className="px-2.5 py-1 rounded bg-purple-950 border border-purple-800 text-purple-300">
                  ECDH P-256 + AES-256-GCM
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
                  Server / Database (Ciphertext Only)
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
                <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  Recipient Device (Decryption)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                The server should not receive the plaintext message in the E2EE flow. Private keys are never exported to the database.
              </p>
            </div>

            {/* Interactive E2EE Sandbox */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Enter Plaintext Message to Encrypt:
                </label>
                <Button
                  size="sm"
                  onClick={handleRunE2eeSimulation}
                  disabled={!e2eePlaintext.trim() || isE2eeRunning}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3.5"
                >
                  {isE2eeRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Run E2EE Simulation"}
                </Button>
              </div>
              <input
                type="text"
                value={e2eePlaintext}
                onChange={(e) => setE2eePlaintext(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                placeholder="Type confidential message..."
              />
            </div>

            {/* E2EE Results */}
            {e2eeState && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Unlock className="h-4 w-4 text-emerald-400" />
                      Recipient Decryption Result (Bob):
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300">
                      "{e2eeState.decryptedPlaintext}"
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Recovered client-side with shared secret
                    </span>
                  </div>

                  {e2eeState.tamperPassed ? (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          Tamper Detection Test (1-Bit Modification Detected)
                        </span>
                        <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700/50 text-[10px] uppercase tracking-wider font-mono">
                          STATUS: PASS — TAMPERING DETECTED
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-[11px] font-mono text-slate-300 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">ORIGINAL MESSAGE</span>
                          <span className="text-emerald-400 flex items-center gap-1">✓ Decrypted</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">1-BIT FLIP SIMULATION</span>
                          <span className="text-emerald-400 flex items-center gap-1">✓ Modified</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">TAMPERING DETECTED</span>
                          <span className="text-emerald-400 flex items-center gap-1">✓ Confirmed</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">AUTH TAG VERIFICATION</span>
                          <span className="text-emerald-400 flex items-center gap-1">✓ Rejection Verified</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-emerald-300">
                            RESULT: AES-GCM INTEGRITY CHECK PASSED
                          </span>
                          <span className="text-[11px] text-emerald-400/90 block mt-0.5">
                            {e2eeState.tamperError}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1 italic">
                            AES-GCM authentication tag mismatch confirmed. The mismatch is the expected result because the ciphertext was deliberately modified.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/40 space-y-1.5">
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        Tamper Detection Test Failed:
                      </span>
                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
                        <span className="text-[11px]">{e2eeState.tamperError}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wire Payload */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">
                    Exact Ciphertext Transmitted to Server & Stored in PostgreSQL:
                  </span>
                  <pre className="rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-amber-300 overflow-x-auto border border-slate-800">
                    {e2eeState.fullCiphertextPayload}
                  </pre>
                </div>
              </div>
            )}

            {/* Admin Privacy Boundary Matrix */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-200 block font-mono">
                Administrator Privacy & Capability Boundary:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Administrator CAN:
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>✓ Manage user accounts and roles</li>
                    <li>✓ Moderate public posts and comments</li>
                    <li>✓ Review and resolve abuse reports</li>
                    <li>✓ Inspect security audit metadata</li>
                    <li>✓ Unlock temporarily locked accounts</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 space-y-2">
                  <span className="font-bold text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-400" />
                    Administrator CANNOT:
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>✕ Read user E2EE private keys</li>
                    <li>✕ Decrypt private E2EE messages</li>
                    <li>✕ Retrieve plaintext E2EE messages from DB</li>
                    <li>✕ View plaintext user passwords</li>
                    <li>✕ Hijack active sessions via DB hashes</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 06: SECURITY ARCHITECTURE & DEFENSE LAYERS */}
      {/* ========================================================================= */}
      {(activeSection === "all" || activeSection === "06-arch") && (
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Network className="h-5 w-5 text-indigo-400" />
                06 — Instagramer Security Architecture & Defense Layers
              </CardTitle>
              <Badge variant="outline" className="border-indigo-800 text-indigo-300 bg-indigo-950/40 text-[10px] w-fit">
                Defense in Depth
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Holistic overview of the Instagramer multi-layered security architecture, comparing real production security against educational simulations.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Visual Architecture ASCII/Box Diagram */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed">
              <pre className="text-indigo-300">
{`                    INSTAGRAMER APPLICATION
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  Authentication            Sessions              Messaging
        │                      │                      │
     Argon2id           HTTP-only Cookie          Client E2EE
  (64MB Memory)          (SameSite/Secure)     (ECDH P-256 + AES)
        │                      │                      │
 Lockout Defense            SHA-256                Ciphertext
 (5 Fails / 15m)         (Digest Only)           (Zero Plaintext)
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                       Neon PostgreSQL
                               │
                  Audit Logs / Safe Metadata`}
              </pre>
            </div>

            {/* Clickable 7 Security Layers */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block font-mono">
                Seven-Layer Defense Stack (Click to Expand):
              </span>
              <div className="space-y-2">
                {[
                  {
                    num: 1,
                    title: "Layer 01 — Input Validation & Type Safety",
                    summary: "TypeScript types, length boundaries, and strict sanitization on all incoming request payloads.",
                    detail: "Prevents injection vulnerabilities and malformed inputs before reaching business logic or database queries.",
                  },
                  {
                    num: 2,
                    title: "Layer 02 — Argon2id Password Hashing",
                    summary: "64MB memory-hard KDF, 3 time iterations, single thread, 16-byte random salt per user.",
                    detail: "OWASP-compliant key derivation that renders GPU and ASIC password cracking farms cost-prohibitive.",
                  },
                  {
                    num: 3,
                    title: "Layer 03 — Brute-Force Account Lockout",
                    summary: "5 failed authentication attempts trigger 15-minute temporary lockout tracked in PostgreSQL.",
                    detail: "Thwarts automated credential-stuffing and password-spraying attacks while allowing self-recovery after expiration.",
                  },
                  {
                    num: 4,
                    title: "Layer 04 — Session Security & Token Hashing",
                    summary: "High-entropy 32-byte tokens issued to HTTP-only cookies; database stores strictly SHA-256 digests.",
                    detail: "Protects against XSS token theft via HttpOnly flags and safeguards active sessions against database leakages.",
                  },
                  {
                    num: 5,
                    title: "Layer 05 — Server-Side Role Authorization",
                    summary: "Strict requireAdmin() and requireRole() gatekeepers on all administrative routes and API endpoints.",
                    detail: "Direct API invocations are validated on the server; client UI visibility alone is never trusted.",
                  },
                  {
                    num: 6,
                    title: "Layer 06 — Immutable Audit Logging",
                    summary: "SecurityAuditService logs all critical events while automatically stripping sensitive credentials.",
                    detail: "Provides accountability and security telemetry without compromising user passwords, tokens, or encryption keys.",
                  },
                  {
                    num: 7,
                    title: "Layer 07 — E2EE Privacy Boundary",
                    summary: "Client-side Web Crypto API with ECDH P-256 and AES-256-GCM authenticated encryption.",
                    detail: "Zero-plaintext server policy: Neither application servers nor database administrators can decrypt private messages.",
                  },
                ].map((layer) => {
                  const isExpanded = expandedLayer === layer.num;
                  return (
                    <div
                      key={layer.num}
                      onClick={() => setExpandedLayer(isExpanded ? null : layer.num)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isExpanded
                          ? "border-indigo-700 bg-indigo-950/30"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono ${
                              isExpanded
                                ? "border-indigo-500 text-indigo-300 bg-indigo-900/50"
                                : "border-slate-700 text-slate-400"
                            }`}
                          >
                            LAYER 0{layer.num}
                          </Badge>
                          <span className="font-semibold text-xs text-slate-200">{layer.title}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{layer.summary}</p>
                      {isExpanded && (
                        <div className="mt-2.5 pt-2 border-t border-indigo-900/50 text-[11px] text-indigo-200">
                          <strong className="text-indigo-100">Technical Rationale: </strong>
                          {layer.detail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real vs Simulated Security Comparison Table */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-200 block font-mono">
                Real Production Security vs Educational Simulation Comparison:
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="p-2">Security Domain</th>
                      <th className="p-2 text-emerald-400">Real Production Security</th>
                      <th className="p-2 text-indigo-400">Educational Laboratory Simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-[11px]">
                    <tr>
                      <td className="p-2 font-bold text-slate-300">Credentials</td>
                      <td className="p-2 text-slate-400">Real user passwords hashed with Argon2id in DB</td>
                      <td className="p-2 text-indigo-300">Synthetic in-memory strings only (never persisted)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-300">Account Lockout</td>
                      <td className="p-2 text-slate-400">PostgreSQL User.failedLoginAttempts & lockedUntil</td>
                      <td className="p-2 text-indigo-300">Browser state simulator (zero database modifications)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-300">Sessions</td>
                      <td className="p-2 text-slate-400">Encrypted HTTP-only cookies + SHA-256 DB table</td>
                      <td className="p-2 text-indigo-300">Ephemeral in-memory 32-byte token and digest generator</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-300">Audit Trail</td>
                      <td className="p-2 text-slate-400">Immutable AuditLog records in PostgreSQL</td>
                      <td className="p-2 text-indigo-300">Interactive live redaction tester with sample payloads</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-300">E2EE Privacy</td>
                      <td className="p-2 text-slate-400">Device-stored private keys + ciphertext DB messages</td>
                      <td className="p-2 text-indigo-300">Alice/Bob ephemeral keypairs + bit-flip tamper test</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
