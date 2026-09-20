"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  ShieldCheck,
  Send,
  Plus,
  Search,
  Trash2,
  Lock,
  Loader2,
  X,
  AlertCircle,
  KeyRound,
  User as UserIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  encryptMessage,
  decryptMessage,
  deriveSharedAesKey,
  importPublicKey,
} from "@/security/encryption";
import { getOrCreateUserKeys } from "@/security/keyManagement";

interface SafeUserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ConversationItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  otherUser: SafeUserSummary | null;
  lastMessage: {
    id: string;
    senderId: string;
    isOwnMessage: boolean;
    ciphertext: string;
    encryptionVersion: number;
    createdAt: string;
  } | null;
}

interface DecryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  isOwnMessage: boolean;
  plaintext: string | null;
  decryptionError: boolean;
  encryptionVersion: number;
  createdAt: string;
  sender: SafeUserSummary;
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<SafeUserSummary | null>(null);
  const [myKeys, setMyKeys] = useState<{
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    publicKeyJwk: string;
  } | null>(null);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConvDetails, setSelectedConvDetails] = useState<ConversationItem | null>(null);

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Chat Modal state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SafeUserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Cached shared AES keys per conversation: conversationId -> CryptoKey
  const sharedKeysRef = useRef<Map<string, CryptoKey>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch current user and setup client-side E2EE key pair
  useEffect(() => {
    async function initUserAndKeys() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) {
          const userObj: SafeUserSummary = {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.profile?.displayName || data.user.username,
            avatarUrl: data.user.profile?.avatarUrl || null,
          };
          setCurrentUser(userObj);

          // Initialize or load client-side key pair (stored only on device)
          const keys = await getOrCreateUserKeys(userObj.id);
          setMyKeys(keys);
        }
      } catch (err) {
        console.error("Failed to initialize user keys:", err);
      }
    }

    initUserAndKeys();
  }, []);

  // 2. Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, loadConversations]);

  // Helper: Get or derive shared AES-GCM key for a conversation with a partner
  const getSharedKeyForPartner = useCallback(
    async (partnerId: string, partnerUsername: string): Promise<CryptoKey | null> => {
      if (!myKeys) return null;

      const cacheKey = partnerId;
      if (sharedKeysRef.current.has(cacheKey)) {
        return sharedKeysRef.current.get(cacheKey)!;
      }

      try {
        // Fetch recipient's public key from server
        const keyRes = await fetch(`/api/keys?userId=${encodeURIComponent(partnerId)}`);
        if (!keyRes.ok) {
          // Fallback to query by username
          const keyResUser = await fetch(`/api/keys?username=${encodeURIComponent(partnerUsername)}`);
          if (!keyResUser.ok) return null;
          const keyData = await keyResUser.json();
          const partnerPubKey = await importPublicKey(keyData.publicKey);
          const sharedAes = await deriveSharedAesKey(myKeys.privateKey, partnerPubKey);
          sharedKeysRef.current.set(cacheKey, sharedAes);
          return sharedAes;
        }

        const keyData = await keyRes.json();
        const partnerPubKey = await importPublicKey(keyData.publicKey);
        const sharedAes = await deriveSharedAesKey(myKeys.privateKey, partnerPubKey);
        sharedKeysRef.current.set(cacheKey, sharedAes);
        return sharedAes;
      } catch (err) {
        console.error("Failed to derive shared key for partner:", err);
        return null;
      }
    },
    [myKeys]
  );

  // 3. Load & decrypt messages for the selected conversation
  const loadMessages = useCallback(
    async (convId: string) => {
      if (!myKeys || !currentUser) return;
      setIsLoadingMessages(true);
      setErrorMessage(null);

      try {
        const currentConv = conversations.find((c) => c.id === convId);
        if (!currentConv || !currentConv.otherUser) {
          setIsLoadingMessages(false);
          return;
        }

        setSelectedConvDetails(currentConv);

        // Derive shared AES key with the other participant
        const sharedKey = await getSharedKeyForPartner(
          currentConv.otherUser.id,
          currentConv.otherUser.username
        );

        const res = await fetch(`/api/conversations/${convId}/messages?limit=50`);
        if (!res.ok) {
          throw new Error("Failed to load conversation messages");
        }

        const data = await res.json();
        const rawMsgs = data.messages || [];

        // Client-side decryption loop
        const decryptedList: DecryptedMessage[] = await Promise.all(
          rawMsgs.map(async (msg: any) => {
            let plaintext: string | null = null;
            let decryptionError = false;

            if (sharedKey) {
              try {
                plaintext = await decryptMessage(msg.ciphertext, sharedKey);
              } catch {
                decryptionError = true;
              }
            } else {
              decryptionError = true;
            }

            return {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              isOwnMessage: msg.isOwnMessage,
              plaintext,
              decryptionError,
              encryptionVersion: msg.encryptionVersion,
              createdAt: msg.createdAt,
              sender: msg.sender,
            };
          })
        );

        setMessages(decryptedList);
      } catch (err: any) {
        setErrorMessage(err.message || "Error loading messages");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [conversations, myKeys, currentUser, getSharedKeyForPartner]
  );

  useEffect(() => {
    if (selectedConversationId && myKeys) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, myKeys, loadMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send encrypted message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending || !selectedConversationId || !selectedConvDetails?.otherUser || !myKeys) {
      return;
    }

    const plaintextToSend = inputMessage.trim();
    setIsSending(true);
    setErrorMessage(null);

    try {
      const sharedKey = await getSharedKeyForPartner(
        selectedConvDetails.otherUser.id,
        selectedConvDetails.otherUser.username
      );

      if (!sharedKey) {
        throw new Error(
          "Recipient has not published an encryption key yet. Message could not be encrypted."
        );
      }

      // CLIENT-SIDE ENCRYPTION (AES-256-GCM with fresh 12-byte random IV)
      const ciphertextPayload = await encryptMessage(plaintextToSend, sharedKey);

      // Transmit strictly ciphertext to the server
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: ciphertextPayload,
          encryptionVersion: 1,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send message");
      }

      const resData = await res.json();
      const serverMsg = resData.message;

      // Add to local chat view
      const newDecrypted: DecryptedMessage = {
        id: serverMsg.id,
        conversationId: serverMsg.conversationId,
        senderId: serverMsg.senderId,
        isOwnMessage: true,
        plaintext: plaintextToSend,
        decryptionError: false,
        encryptionVersion: serverMsg.encryptionVersion,
        createdAt: serverMsg.createdAt,
        sender: serverMsg.sender,
      };

      setMessages((prev) => [...prev, newDecrypted]);
      setInputMessage("");

      // Refresh conversation list to update last message preview
      loadConversations();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to encrypt and send message");
    } finally {
      setIsSending(false);
    }
  };

  // 5. Delete own message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        loadConversations();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to delete message");
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // 6. User search for starting new conversation
  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // 7. Start or open conversation with target user
  const handleStartConversation = async (targetUser: SafeUserSummary) => {
    setIsStartingChat(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          targetUsername: targetUser.username,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start conversation");
      }

      const data = await res.json();
      setIsNewChatOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
      setSelectedConversationId(data.conversationId);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start conversation");
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-2">
      {/* Page Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Messages
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            End-to-End Encrypted direct communication
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            E2EE Active
          </Badge>
          <Button
            size="sm"
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Chat Window */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[650px]">
        {/* Left Column: Conversations List */}
        <Card className="md:col-span-4 flex flex-col h-full rounded-2xl border-slate-200/90 shadow-sm dark:border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chats ({conversations.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNewChatOpen(true)}
              className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-indigo-600 dark:text-slate-400"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoadingConversations ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No conversations yet.
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Start a conversation with another user.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsNewChatOpen(true)}
                  className="mt-4 rounded-xl text-xs"
                >
                  Start New Chat
                </Button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConversationId;
                const other = conv.otherUser;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-center gap-3 ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-sm">
                      {other?.displayName
                        ? other.displayName.charAt(0).toUpperCase()
                        : "U"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {other?.displayName || other?.username || "Unknown"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-slate-400 truncate">
                          {conv.lastMessage
                            ? conv.lastMessage.isOwnMessage
                              ? "You: Encrypted message"
                              : "Encrypted message"
                            : "No messages yet"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Active Chat Window */}
        <Card className="md:col-span-8 flex flex-col h-full rounded-2xl border-slate-200/90 shadow-sm dark:border-slate-800 overflow-hidden">
          {selectedConversationId && selectedConvDetails ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs">
                    {selectedConvDetails.otherUser?.displayName
                      ? selectedConvDetails.otherUser.displayName.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {selectedConvDetails.otherUser?.displayName}
                      <span className="text-[11px] font-normal text-slate-400">
                        @{selectedConvDetails.otherUser?.username}
                      </span>
                    </h2>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <Lock className="h-2.5 w-2.5" />
                      <span>End-to-End Encrypted (AES-256-GCM)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-indigo-200 bg-indigo-50/60 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400"
                  >
                    ECDH-P256
                  </Badge>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Messages Bubble Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/30">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <Lock className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No messages yet.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
                      Send the first message. Your communication is encrypted on this device and can only be read by you and {selectedConvDetails.otherUser?.displayName}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.isOwnMessage;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${
                          isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`relative max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                            isOwn
                              ? "bg-indigo-600 text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
                          }`}
                        >
                          {/* Decrypted Plaintext Content */}
                          {msg.decryptionError ? (
                            <span className="italic text-rose-300 dark:text-rose-400">
                              Unable to decrypt this message
                            </span>
                          ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {msg.plaintext}
                            </p>
                          )}

                          {/* Message Footer */}
                          <div
                            className={`flex items-center gap-1 mt-1 text-[9px] ${
                              isOwn ? "text-indigo-200 justify-end" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete message"
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 text-rose-200 hover:text-rose-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <textarea
                    rows={1}
                    value={inputMessage}
                    maxLength={2000}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type an encrypted message..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {inputMessage.length > 1500 && (
                    <span className="absolute right-2 bottom-1.5 text-[9px] text-slate-400">
                      {inputMessage.length}/2000
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 flex items-center justify-center gap-1.5"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span className="text-xs">Send</span>
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* No Conversation Selected Placeholder */
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50/20 dark:bg-slate-900/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-950/60 dark:text-indigo-400">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">
                Your Direct Messages
              </h2>
              <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send end-to-end encrypted direct messages to any Instagramer user. Content is encrypted before leaving your browser and stored as ciphertext on the database.
              </p>
              <Button
                onClick={() => setIsNewChatOpen(true)}
                className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Start a Conversation
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* New Chat / User Search Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  New Encrypted Conversation
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsNewChatOpen(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Search user by username or display name..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
              {isSearching ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {searchQuery.trim()
                    ? "No users found matching your search."
                    : "Type a username or name to find someone."}
                </div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    disabled={isStartingChat}
                    onClick={() => handleStartConversation(user)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {user.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isStartingChat}
                      className="rounded-lg text-[11px] h-7 px-2.5"
                    >
                      Chat
                    </Button>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
