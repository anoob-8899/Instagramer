/**
 * Instagramer End-to-End Encryption (E2EE) Module
 *
 * Uses standard Web Crypto API (SubtleCrypto) primitives:
 * - Key Agreement: ECDH with NIST Curve P-256
 * - Key Derivation: HKDF with SHA-256 to derive 256-bit AES keys
 * - Authenticated Encryption: AES-256-GCM with fresh 12-byte cryptographically random IVs
 *
 * ZERO PLAINTEXT POLICY:
 * - Plaintext is never transmitted to the server
 * - Plaintext is never stored in PostgreSQL or localStorage
 * - Plaintext is never logged to server or browser consoles
 */

export interface CiphertextPayload {
  v: number; // Encryption format version
  iv: string; // Base64-encoded 12-byte initialization vector
  ct: string; // Base64-encoded ciphertext with authentication tag
  algorithm?: string;
}

/**
 * Utility: Convert Uint8Array to standard Base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = typeof Buffer !== "undefined"
    ? Buffer.from(base64, "base64").toString("binary")
    : atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (SubtleCrypto) is not available in the current environment.");
}

/**
 * Generates an asymmetric ECDH keypair over NIST curve P-256.
 * The private key stays strictly client-side.
 */
export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
  const subtle = getSubtleCrypto();
  return subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable for client-side local persistence
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Exports a public key to a serialized JSON Web Key (JWK) string for server registration.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const jwk = await subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Imports a public key from a serialized JWK string.
 */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const jwk = typeof jwkString === "string" ? JSON.parse(jwkString) : jwkString;
  return subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

/**
 * Exports a private key to a serialized JWK string for local client storage only.
 * NEVER send this string to the server.
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const jwk = await subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Imports a private key from local client storage.
 */
export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const jwk = typeof jwkString === "string" ? JSON.parse(jwkString) : jwkString;
  return subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Derives a shared 256-bit AES-GCM session key using ECDH and HKDF-SHA256.
 */
export async function deriveSharedAesKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
  saltInfo = "instagramer-e2ee-v1"
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();

  // 1. Derive shared raw secret bits using ECDH
  const sharedBits = await subtle.deriveBits(
    {
      name: "ECDH",
      public: theirPublicKey,
    },
    myPrivateKey,
    256
  );

  // 2. Import derived bits as an HKDF key
  const hkdfKey = await subtle.importKey(
    "raw",
    sharedBits,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  // 3. Derive 256-bit AES-GCM symmetric key
  const encoder = new TextEncoder();
  return subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(saltInfo),
      info: encoder.encode("instagramer-aes-gcm-message-encryption"),
    },
    hkdfKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Generates a fresh 12-byte random initialization vector (IV) for every invocation.
 */
export async function encryptMessage(
  plaintext: string,
  aesKey: CryptoKey
): Promise<string> {
  const subtle = getSubtleCrypto();

  // Generate fresh cryptographically secure 12-byte IV/nonce
  const iv = new Uint8Array(12);
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    globalThis.crypto.getRandomValues(iv);
  } else {
    throw new Error("Crypto getRandomValues unavailable");
  }

  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);

  const encryptedBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedPlaintext
  );

  const payload: CiphertextPayload = {
    v: 1,
    iv: uint8ArrayToBase64(iv),
    ct: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    algorithm: "AES-256-GCM+ECDH-P256",
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts a ciphertext payload using AES-256-GCM.
 * Returns the decoded plaintext string or throws if authentication verification fails.
 */
export async function decryptMessage(
  ciphertextJson: string,
  aesKey: CryptoKey
): Promise<string> {
  const subtle = getSubtleCrypto();

  let payload: CiphertextPayload;
  try {
    payload = JSON.parse(ciphertextJson);
  } catch {
    throw new Error("Invalid ciphertext payload format");
  }

  if (!payload.iv || !payload.ct) {
    throw new Error("Missing required ciphertext fields (iv, ct)");
  }

  if (payload.v !== 1) {
    throw new Error(`Unsupported encryption version: ${payload.v}`);
  }

  const iv = base64ToUint8Array(payload.iv);
  const encryptedBytes = base64ToUint8Array(payload.ct);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encryptedBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
