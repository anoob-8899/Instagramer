# Instagramer End-to-End Encryption (E2EE) Specification & Threat Model

## 1. Overview
Instagramer implements client-side End-to-End Encryption (E2EE) for direct one-on-one user messaging. Message content is encrypted on the sender's client device before transmission and can only be decrypted on the recipient's client device.

The central server, API endpoints, PostgreSQL database, loggers, and network intermediaries never receive, store, or log plaintext message content.

---

## 2. Cryptographic Primitives & Architecture

### Standard Established Primitives (Web Crypto API)
All cryptographic operations use native browser/Node.js `SubtleCrypto` primitives. No custom cryptography or homebrew ciphers are used.

| Component | Standard Primitive | Specification | Purpose |
| :--- | :--- | :--- | :--- |
| **Key Agreement** | **ECDH** (Elliptic Curve Diffie-Hellman) | NIST Curve **P-256** (`secp256r1`) | Generates ephemeral/session key pairs on device; derives shared secret |
| **Key Derivation** | **HKDF** (RFC 5869) | **SHA-256** | Expands ECDH shared secret bits into symmetric 256-bit encryption key |
| **Symmetric Encryption** | **AES-GCM** (Galois/Counter Mode) | **256-bit Key**, **12-byte random IV** | Authenticated encryption with associated data (AEAD); provides confidentiality and integrity |

---

## 3. Key Lifecycle & Storage

### 3.1 Public Keys
- Serialized as standardized JSON Web Key (JWK) strings.
- Stored server-side in the `user_encryption_keys` PostgreSQL table (`UserEncryptionKey` model).
- Publicly retrievable via `GET /api/keys?userId=...` or `GET /api/keys?username=...` for key exchange.

### 3.2 Private Keys
- Generated on the client device during initial user initialization.
- Stored locally in browser persistent client storage (`localStorage` / IndexedDB).
- **NEVER** transmitted across the network, never stored in PostgreSQL, and never logged in error logs or audit records.

### 3.3 Message Payload Format (Version 1)
```json
{
  "v": 1,
  "iv": "<Base64 encoded 12-byte initialization vector>",
  "ct": "<Base64 encoded AES-256-GCM ciphertext + 16-byte authentication tag>",
  "algorithm": "AES-256-GCM+ECDH-P256"
}
```

---

## 4. Message Transmission & Access Control Flow

```text
Sender Client                     Instagramer Server                    Recipient Client
      │                                   │                                    │
      ├─ 1. Query Recipient Public Key ──>│                                    │
      │<─ 2. Return Public Key (JWK) ─────┤                                    │
      │                                   │                                    │
      ├─ 3. Derive AES-256-GCM Key (ECDH) │                                    │
      ├─ 4. Encrypt Plaintext with fresh IV                                    │
      │                                   │                                    │
      ├─ 5. POST /messages (Ciphertext) ─>│                                    │
      │                                   ├─ 6. Verify Auth & Participation    │
      │                                   ├─ 7. Store Ciphertext in PostgreSQL │
      │                                   │                                    │
      │                                   │<─ 8. GET /messages (Ciphertext) ───┤
      │                                   ├─ 9. Transmit Ciphertext ──────────>┤
      │                                   │                                    │
      │                                   │    10. Derive AES-256-GCM Key (ECDH)
      │                                   │    11. Authenticate & Decrypt ─────┤
      │                                   │    12. Render in Memory ───────────┤
```

---

## 5. Security Guarantees & Limitations

### 5.1 Guarantees Provided
1. **Confidentiality in Transit and at Rest**: Database administrators, compromised database backups, and network sniffers see only random ciphertext.
2. **Cryptographic Integrity & Authenticity**: Tampering with a single bit of ciphertext or IV causes AES-GCM authentication tag verification to fail immediately.
3. **Sender Ownership & Authorization**: Non-participants cannot read conversation messages; only message senders can delete their own messages.

### 5.2 Technical Security Limitations
1. **Browser Key Storage Constraints**:
   - Private keys stored in `localStorage` / IndexedDB are vulnerable to malicious client scripts if an XSS vulnerability exists on the origin. Strict Content Security Policy (CSP) and input sanitization are essential.
   - Clearing browser data, using incognito mode, or switching physical devices resets local private keys unless a secure multi-device key backup protocol is implemented.
2. **Metadata Visibility**:
   - E2EE protects **message content**, not conversation metadata. The server necessarily knows who participates in conversations, timestamps of communication, and message ciphertext payload sizes.
3. **No Ratcheting (Signal Protocol Comparison)**:
   - This phase uses static per-user ECDH keys with HKDF and unique per-message AES-GCM IVs. Compromise of a user's static private key would compromise past messages encrypted with that key. Future phases can introduce double-ratchet mechanisms for forward secrecy.
4. **Endpoint Security**:
   - Plaintext exists in memory while the user is actively composing or reading a message. A compromised client operating system, browser malware, or shoulder surfing can observe decrypted plaintext.

---

## 6. Language & Terminology Guidelines
- **Accurate**: "End-to-End Encrypted message content using AES-256-GCM and ECDH P-256."
- **Avoid**: "100% unbreakable", "completely anonymous", "military grade".
