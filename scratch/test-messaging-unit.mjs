import assert from "node:assert";

console.log("=== RUNNING MESSAGING LOGIC UNIT TESTS ===");

// 1. Self-Conversation Prevention
console.log("Test 1: Self conversation prevention logic...");
function canStartConversation(userIdA, userIdB) {
  if (!userIdA || !userIdB) return { allowed: false, error: "Target required" };
  if (userIdA === userIdB) return { allowed: false, error: "Cannot start conversation with yourself" };
  return { allowed: true };
}
assert.strictEqual(canStartConversation("user-1", "user-1").allowed, false);
assert.strictEqual(canStartConversation("user-1", "user-2").allowed, true);
console.log("✔ Self conversation correctly prevented");

// 2. Ciphertext Payload & Size Limit Validation
console.log("Test 2: Ciphertext format & size limit verification...");
const MAX_CIPHERTEXT_LENGTH = 65536;

function validateMessagePayload(ciphertext, encryptionVersion) {
  if (!ciphertext || typeof ciphertext !== "string") {
    return { valid: false, error: "Ciphertext required" };
  }
  if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
    return { valid: false, error: "Payload too large" };
  }
  if (encryptionVersion !== 1) {
    return { valid: false, error: "Unsupported version" };
  }
  try {
    const parsed = JSON.parse(ciphertext);
    if (!parsed.iv || !parsed.ct || parsed.v !== 1) {
      return { valid: false, error: "Invalid structure" };
    }
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
  return { valid: true };
}

assert.strictEqual(validateMessagePayload("", 1).valid, false);
assert.strictEqual(validateMessagePayload("x".repeat(70000), 1).valid, false);
assert.strictEqual(validateMessagePayload("not json", 1).valid, false);
assert.strictEqual(validateMessagePayload(JSON.stringify({ v: 2, iv: "a", ct: "b" }), 2).valid, false);
assert.strictEqual(validateMessagePayload(JSON.stringify({ v: 1, iv: "aXZfMTIzNA==", ct: "Y3RfZGF0YQ==" }), 1).valid, true);
console.log("✔ Ciphertext payload validator verified");

// 3. Participant Authorization Logic
console.log("Test 3: Participant authorization logic...");
function isUserParticipant(conversation, userId) {
  return conversation.participants.some(p => p.userId === userId);
}
const mockConv = {
  id: "conv-123",
  participants: [{ userId: "alice" }, { userId: "bob" }],
};
assert.strictEqual(isUserParticipant(mockConv, "alice"), true);
assert.strictEqual(isUserParticipant(mockConv, "bob"), true);
assert.strictEqual(isUserParticipant(mockConv, "eve"), false);
console.log("✔ Participant authorization checked");

// 4. Message Deletion Authorization Logic
console.log("Test 4: Message deletion authorization...");
function canDeleteMessage(message, requestingUserId) {
  return message.senderId === requestingUserId;
}
const mockMsg = { id: "msg-1", senderId: "alice" };
assert.strictEqual(canDeleteMessage(mockMsg, "alice"), true);
assert.strictEqual(canDeleteMessage(mockMsg, "bob"), false);
assert.strictEqual(canDeleteMessage(mockMsg, "eve"), false);
console.log("✔ Message deletion ownership checked");

console.log("\n=== ALL MESSAGING LOGIC UNIT TESTS PASSED ===");
