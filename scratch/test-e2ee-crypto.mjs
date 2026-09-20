import assert from "node:assert";
import {
  generateUserKeyPair,
  exportPublicKey,
  importPublicKey,
  exportPrivateKey,
  importPrivateKey,
  deriveSharedAesKey,
  encryptMessage,
  decryptMessage,
} from "../src/security/encryption.ts";

async function runCryptoTests() {
  console.log("=== STARTING E2EE CRYPTOGRAPHIC TESTS ===");

  // 1. Key Generation
  console.log("Test 1: Generating ECDH P-256 keypairs for Alice and Bob...");
  const aliceKeys = await generateUserKeyPair();
  const bobKeys = await generateUserKeyPair();
  assert(aliceKeys.publicKey && aliceKeys.privateKey, "Alice keys must be generated");
  assert(bobKeys.publicKey && bobKeys.privateKey, "Bob keys must be generated");
  console.log("✔ Keypairs generated successfully");

  // 2. Key Serialization (Export/Import)
  console.log("Test 2: Key Export and Import (JWK format)...");
  const alicePubJwk = await exportPublicKey(aliceKeys.publicKey);
  const alicePrivJwk = await exportPrivateKey(aliceKeys.privateKey);
  assert(typeof alicePubJwk === "string", "Public key export must be string");
  assert(typeof alicePrivJwk === "string", "Private key export must be string");

  const importedAlicePub = await importPublicKey(alicePubJwk);
  const importedAlicePriv = await importPrivateKey(alicePrivJwk);
  assert(importedAlicePub.algorithm.name === "ECDH", "Imported public key must be ECDH");
  assert(importedAlicePriv.algorithm.name === "ECDH", "Imported private key must be ECDH");
  console.log("✔ Key serialization verified");

  // 3. Shared Key Derivation (ECDH + HKDF SHA-256)
  console.log("Test 3: Deriving shared AES-256-GCM session keys...");
  const aliceSharedKey = await deriveSharedAesKey(aliceKeys.privateKey, bobKeys.publicKey);
  const bobSharedKey = await deriveSharedAesKey(bobKeys.privateKey, aliceKeys.publicKey);
  assert(aliceSharedKey.algorithm.name === "AES-GCM", "Derived key must be AES-GCM");
  assert(bobSharedKey.algorithm.name === "AES-GCM", "Derived key must be AES-GCM");
  console.log("✔ Shared key agreement completed");

  // 4. Message Encryption & Decryption
  console.log("Test 4: Encrypting and decrypting test plaintext message...");
  const secretMessage = "Confidential payload for Instagramer E2EE Verification!";
  const encryptedPayload = await encryptMessage(secretMessage, aliceSharedKey);

  assert(typeof encryptedPayload === "string", "Encrypted output must be string");
  assert(!encryptedPayload.includes(secretMessage), "Ciphertext MUST NOT contain plaintext");

  const parsedPayload = JSON.parse(encryptedPayload);
  assert.strictEqual(parsedPayload.v, 1, "Payload version must be 1");
  assert(parsedPayload.iv && parsedPayload.ct, "Payload must have iv and ct");
  assert(parsedPayload.ct !== secretMessage, "Ciphertext must not match plaintext");

  const decryptedMessage = await decryptMessage(encryptedPayload, bobSharedKey);
  assert.strictEqual(decryptedMessage, secretMessage, "Decrypted message must match original plaintext exactly");
  console.log("✔ Authenticated AES-GCM encryption and decryption verified");

  // 5. Fresh IV / Nonce per Message Verification
  console.log("Test 5: Verifying fresh random IV per encryption...");
  const payload1 = await encryptMessage(secretMessage, aliceSharedKey);
  const payload2 = await encryptMessage(secretMessage, aliceSharedKey);
  const parsed1 = JSON.parse(payload1);
  const parsed2 = JSON.parse(payload2);

  assert.notStrictEqual(parsed1.iv, parsed2.iv, "Each message must use a fresh, unique IV");
  assert.notStrictEqual(parsed1.ct, parsed2.ct, "Identical plaintext must produce distinct ciphertext with different IVs");
  console.log("✔ Nonce uniqueness verified");

  // 6. Tamper Detection Test
  console.log("Test 6: Tamper detection test (bit-flip in ciphertext)...");
  let tamperedCt = parsedPayload.ct;
  const flippedChar = tamperedCt.charAt(tamperedCt.length - 2) === "A" ? "B" : "A";
  tamperedCt = tamperedCt.slice(0, -2) + flippedChar + tamperedCt.slice(-1);
  const tamperedPayload = JSON.stringify({ ...parsedPayload, ct: tamperedCt });

  let tamperCaught = false;
  try {
    await decryptMessage(tamperedPayload, bobSharedKey);
  } catch {
    tamperCaught = true;
  }
  assert(tamperCaught, "Tampered ciphertext MUST fail AES-GCM authentication verification");
  console.log("✔ Tamper detection verified (AES-GCM integrity check passed)");

  console.log("\n=== ALL E2EE CRYPTOGRAPHIC TESTS PASSED SUCCESSFULLY ===");
}

runCryptoTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
