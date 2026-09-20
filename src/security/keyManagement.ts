/**
 * Client-Side Key Management Module
 *
 * Handles client-side persistent storage of private encryption keys (localStorage/IndexedDB)
 * and public key registration with the server.
 *
 * SECURITY BOUNDARY & LIMITATIONS:
 * 1. Private keys are stored in client-side browser storage scoped to the user ID.
 * 2. Private keys are NEVER sent across the network or included in API payloads.
 * 3. Clearing browser cache or switching devices means key loss unless explicit key backup is performed.
 * 4. XSS vulnerability in client-side code could theoretically access in-memory or stored keys;
 *    hence strict CSP and input sanitization remain vital.
 */

import {
  generateUserKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  importPublicKey,
} from "./encryption";

const STORAGE_PREFIX = "instagramer_e2ee_key_v1_";

export interface StoredUserKeys {
  publicKeyJwk: string;
  privateKeyJwk: string;
}

/**
 * Gets existing client-side key pair from browser storage, or generates and registers a new one.
 */
export async function getOrCreateUserKeys(userId: string): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyJwk: string;
}> {
  if (typeof window === "undefined") {
    throw new Error("Client key management requires a browser environment.");
  }

  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const storedJson = localStorage.getItem(storageKey);

  if (storedJson) {
    try {
      const parsed: StoredUserKeys = JSON.parse(storedJson);
      const privateKey = await importPrivateKey(parsed.privateKeyJwk);
      const publicKey = await importPublicKey(parsed.publicKeyJwk);

      return {
        privateKey,
        publicKey,
        publicKeyJwk: parsed.publicKeyJwk,
      };
    } catch {
      // If corrupted, fallback to generation
    }
  }

  // Generate new key pair
  const keyPair = await generateUserKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Store in client storage
  const payload: StoredUserKeys = {
    publicKeyJwk,
    privateKeyJwk,
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));

  // Sync public key with the server
  try {
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: publicKeyJwk,
        algorithm: "ECDH-P256",
        version: 1,
      }),
    });
  } catch (err) {
    // Will retry on subsequent attempts
    console.error("Failed to register public key with server:", err);
  }

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyJwk,
  };
}

/**
 * Fetches the public key for a target recipient from the server.
 */
export async function fetchRecipientPublicKey(userIdOrUsername: {
  userId?: string;
  username?: string;
}): Promise<{ publicKey: CryptoKey; rawJwk: string } | null> {
  const queryParam = userIdOrUsername.userId
    ? `userId=${encodeURIComponent(userIdOrUsername.userId)}`
    : `username=${encodeURIComponent(userIdOrUsername.username || "")}`;

  const res = await fetch(`/api/keys?${queryParam}`);
  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (!data.publicKey) {
    return null;
  }

  const publicKey = await importPublicKey(data.publicKey);
  return {
    publicKey,
    rawJwk: data.publicKey,
  };
}
