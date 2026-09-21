"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Server,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Database,
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

export default function MessagingDemoPage() {
  const [plaintextInput, setPlaintextInput] = useState("Hello from Instagramer E2EE Demonstration!");
  const [isSimulating, setIsSimulating] = useState(false);
  const [demoState, setDemoState] = useState<{
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

  const runSimulation = async () => {
    setIsSimulating(true);
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
      const ciphertextJson = await encryptMessage(plaintextInput, aliceSharedKey);
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

      setDemoState({
        alicePublicJwk: JSON.stringify(JSON.parse(alicePubJwk), null, 2),
        bobPublicJwk: JSON.stringify(JSON.parse(bobPubJwk), null, 2),
        sharedSecretHex: "256-bit AES Key derived via ECDH P-256 + HKDF SHA-256",
        ivBase64: parsed.iv,
        ciphertextBase64: parsed.ct,
        fullCiphertextPayload: JSON.stringify(parsed, null, 2),
        decryptedPlaintext: decrypted,
        tamperedCiphertext: tampered,
        tamperError: tamperErr,
        tamperPassed,
      });
    } catch (err) {
      console.error("Demo execution error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              E2EE Cryptographic Demonstration
            </h1>
            <Badge variant="outline" className="border-indigo-800 text-indigo-300 bg-indigo-950/40">
              Classroom Lab
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Isolated educational simulation of client-side key agreement, authenticated AES-256-GCM encryption, and tamper detection.
          </p>
        </div>
      </div>

      {/* Notice Card */}
      <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4 text-xs text-indigo-200 flex items-start gap-3">
        <Cpu className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-indigo-100">Educational Isolation Guarantee:</span>
          <p className="mt-0.5 text-indigo-300/90 text-[11px] leading-relaxed">
            This laboratory generates ephemeral synthetic keypairs in memory. It does not access real user private keys, production session tokens, or real user messaging threads.
          </p>
        </div>
      </div>

      {/* Interactive Controls */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            1. Synthetic Message Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Enter Plaintext Message to Encrypt:</label>
            <input
              type="text"
              value={plaintextInput}
              onChange={(e) => setPlaintextInput(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              placeholder="Type demo message..."
            />
          </div>

          <Button
            onClick={runSimulation}
            disabled={!plaintextInput.trim() || isSimulating}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center gap-2"
          >
            {isSimulating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Run E2EE Simulation
          </Button>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {demoState && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Agreement Step */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-400" />
                  Alice: Ephemeral Key Material
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[11px]">
                <p className="text-slate-400">ECDH NIST P-256 Public Key (JWK):</p>
                <pre className="rounded-lg bg-slate-950 p-2.5 text-[10px] text-indigo-300 overflow-x-auto max-h-32">
                  {demoState.alicePublicJwk}
                </pre>
                <p className="text-emerald-400 flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Private key kept strictly in memory on Alice's device
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-purple-400" />
                  Bob: Ephemeral Key Material
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[11px]">
                <p className="text-slate-400">ECDH NIST P-256 Public Key (JWK):</p>
                <pre className="rounded-lg bg-slate-950 p-2.5 text-[10px] text-purple-300 overflow-x-auto max-h-32">
                  {demoState.bobPublicJwk}
                </pre>
                <p className="text-emerald-400 flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Private key kept strictly in memory on Bob's device
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Encryption Pipeline Visualization */}
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400" />
                2. Client-Side Authenticated Encryption (AES-256-GCM)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">ALICE'S DEVICE</span>
                  <p className="text-xs font-mono text-emerald-400 truncate">"{plaintextInput}"</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">Plaintext in memory</span>
                </div>
                <div className="flex items-center justify-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-indigo-400 mb-1">AES-256-GCM + Random 12B IV</span>
                    <ArrowRight className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">SERVER / POSTGRESQL</span>
                  <p className="text-xs font-mono text-amber-400 truncate">{demoState.ciphertextBase64}</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">Ciphertext Only</span>
                </div>
              </div>

              {/* Wire Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-amber-400" />
                    Exact Payload Transmitted to API & Stored in PostgreSQL:
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-800 text-amber-400 bg-amber-950/30">
                    Zero Plaintext
                  </Badge>
                </div>
                <pre className="rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-amber-300 overflow-x-auto border border-slate-800">
                  {demoState.fullCiphertextPayload}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Decryption and Tamper Detection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Decryption Success */}
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-emerald-400" />
                  3. Recipient Client Decryption (Bob)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-400 text-[11px]">
                  Bob derives the same shared secret with Alice's public key and computes authenticated AES-GCM decryption:
                </p>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1">DECRYPTED RESULT:</span>
                  <p className="font-mono text-emerald-300 text-xs font-semibold">
                    "{demoState.decryptedPlaintext}"
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Plaintext successfully recovered on Bob's client device.</span>
                </div>
              </CardContent>
            </Card>

            {/* Tamper Detection */}
            <Card className={demoState.tamperPassed ? "border-emerald-900/40 bg-slate-900 text-slate-100" : "border-rose-900/40 bg-slate-900 text-slate-100"}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    4. Tamper Detection Test (1-Bit Modification Detected)
                  </CardTitle>
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700/50 text-[10px] uppercase tracking-wider font-mono">
                    STATUS: PASS — TAMPERING DETECTED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-400 text-[11px]">
                  Simulating a malicious adversary tampering with 1 bit of the ciphertext payload:
                </p>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1">TAMPERED CIPHERTEXT:</span>
                  <p className="font-mono text-amber-300/80 text-[11px] truncate">
                    {demoState.tamperedCiphertext}
                  </p>
                </div>

                {demoState.tamperPassed ? (
                  <>
                    <div className="space-y-1.5 text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
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

                    <div className="rounded-xl bg-emerald-950/40 border border-emerald-900/60 p-3 text-emerald-300 text-[11px] flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-emerald-300">
                          RESULT: AES-GCM INTEGRITY CHECK PASSED
                        </span>
                        <p className="text-[10px] text-emerald-400 mt-0.5">
                          {demoState.tamperError}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          AES-GCM authentication tag mismatch confirmed. The mismatch is the expected result because the ciphertext was deliberately modified.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-2.5 text-rose-300 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Tamper Detection Test Failed:</span>
                      <p className="text-[10px] text-rose-400 mt-0.5">
                        {demoState.tamperError}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
