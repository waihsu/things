import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ExternalLink,
  MessageCircleMore,
  SendHorizontal,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "@/src/store/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type ChatParticipant = {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
  guest: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  created_at: string;
  user: ChatParticipant;
};

type ChatHistoryResponse = {
  messages: ChatMessage[];
  online_count: number;
};

type ChatWsEvent =
  | {
      type: "chat:welcome";
      payload: {
        online_count: number;
        user: ChatParticipant;
      };
    }
  | {
      type: "chat:online";
      payload: {
        online_count: number;
      };
    }
  | {
      type: "chat:message";
      payload: ChatMessage;
    }
  | {
      type: "chat:error";
      payload: {
        message: string;
      };
    };

const MAX_DRAFT_LENGTH = 500;

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Now";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const upsertMessage = (current: ChatMessage[], incoming: ChatMessage) => {
  if (current.some((item) => item.id === incoming.id)) {
    return current;
  }
  return [...current, incoming].slice(-240);
};

const parseEvent = (raw: string) => {
  try {
    return JSON.parse(raw) as ChatWsEvent;
  } catch {
    return null;
  }
};

export default function PublicChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selfParticipant, setSelfParticipant] =
    useState<ChatParticipant | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "people">("chat");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  const fallbackName = useMemo(() => {
    if (user?.name?.trim()) return user.name.trim();
    const emailName = user?.email?.split("@")[0]?.trim();
    if (emailName) return emailName;
    return "Guest";
  }, [user?.email, user?.name]);

  const defaultChatAppHref =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
      ? "/chat_app/chat"
      : "https://chat.hsuwai.space/chat";
  const chatAppHref =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_CHAT_APP_URL || defaultChatAppHref;
  const isStandaloneChatApp =
    typeof window !== "undefined" &&
    (window.location.hostname === "chat.hsuwai.space" ||
      window.location.pathname.startsWith("/chat_app"));

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/v1/chat?limit=100");
        if (!response.ok) {
          throw new Error("Failed to fetch chat history");
        }
        const data = (await response.json()) as ChatHistoryResponse;
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setOnlineCount(
          typeof data.online_count === "number" ? data.online_count : 0,
        );
      } catch (error) {
        console.error("[chat] history error:", error);
        setErrorMessage("Unable to load chat history.");
      }
    };

    void loadHistory();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    shouldReconnectRef.current = true;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/api/v1/chat/ws?name=${encodeURIComponent(
      fallbackName,
    )}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
        setErrorMessage(null);
      };

      ws.onclose = () => {
        wsRef.current = null;
        setIsConnected(false);
        if (!shouldReconnectRef.current) return;

        const attempt = Math.min(reconnectAttemptRef.current + 1, 6);
        reconnectAttemptRef.current = attempt;
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setErrorMessage("Realtime chat connection lost. Reconnecting...");
      };

      ws.onmessage = (event) => {
        const parsed = parseEvent(String(event.data));
        if (!parsed) return;

        if (parsed.type === "chat:welcome") {
          setSelfParticipant(parsed.payload.user);
          setOnlineCount(parsed.payload.online_count);
          return;
        }

        if (parsed.type === "chat:online") {
          setOnlineCount(parsed.payload.online_count);
          return;
        }

        if (parsed.type === "chat:message") {
          setMessages((current) => upsertMessage(current, parsed.payload));
          return;
        }

        if (parsed.type === "chat:error") {
          setErrorMessage(parsed.payload.message);
        }
      };
    };

    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [fallbackName]);

  const participants = useMemo(() => {
    const map = new Map<string, ChatParticipant>();
    for (const message of messages) {
      if (!map.has(message.user.id)) {
        map.set(message.user.id, message.user);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return messages;
    return messages.filter((message) =>
      `${message.user.name} ${message.text}`.toLowerCase().includes(normalized),
    );
  }, [messages, query]);

  const latestMessage = messages[messages.length - 1] ?? null;

  useEffect(() => {
    const target = listRef.current;
    if (!target) return;
    target.scrollTop = target.scrollHeight;
  }, [filteredMessages.length]);

  const sendMessage = () => {
    const ws = wsRef.current;
    const text = draft.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !text) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "chat:message",
        text: text.slice(0, MAX_DRAFT_LENGTH),
      }),
    );
    setDraft("");
  };

  return (
    <div className="relative h-full  min-h-0">
      <section className="chat-surface flex h-full min-h-0 flex-col rounded-[2rem] border border-border/60 bg-background/85 shadow-[0_24px_65px_rgba(14,20,34,0.16)] dark:border-white/10 dark:bg-black/25">
        <header className="border-b border-border/60 px-4 py-3 dark:border-white/10 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.34em] text-foreground/55 dark:text-white/55">
                Public Room
              </p>
              <h1 className="mt-1 text-2xl font-[var(--font-editorial)]">
                General Chat
              </h1>
              <p className="mt-1 hidden text-xs text-foreground/60 dark:text-white/60 sm:block">
                Open premium lounge for live community chat.
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {!isStandaloneChatApp ? (
                <a
                  href={chatAppHref}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/[0.04]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Chat App
                </a>
              ) : null}
              <Link
                to="/chat/dm"
                className="rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/[0.04]"
              >
                Direct
              </Link>
              <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/[0.04]">
                {isAuthenticated
                  ? `@${fallbackName}`
                  : `Guest · ${fallbackName}`}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`rounded-full px-3 py-1.5 ${
                activeTab === "chat"
                  ? "bg-brand text-brand-ink"
                  : "border border-border/60 bg-background/80 dark:border-white/15 dark:bg-white/[0.04]"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("people")}
              className={`rounded-full px-3 py-1.5 ${
                activeTab === "people"
                  ? "bg-brand text-brand-ink"
                  : "border border-border/60 bg-background/80 dark:border-white/15 dark:bg-white/[0.04]"
              }`}
            >
              Participants ({participants.length})
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            {latestMessage ? (
              <span className="min-w-0 max-w-[460px] truncate rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-foreground/55 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/55">
                Latest: {latestMessage.user.name} · {latestMessage.text}
              </span>
            ) : (
              <span className="text-foreground/55 dark:text-white/55">
                No messages yet.
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                isConnected
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200"
              }`}
            >
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {isConnected ? "Connected" : "Offline"}
            </span>
          </div>

          {!isStandaloneChatApp ? (
            <a
              href={chatAppHref}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/[0.04] sm:hidden"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Chat App
            </a>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 lg:flex">
          <div
            className={`min-h-0 flex-1 flex-col ${
              activeTab === "people" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="border-b border-border/60 px-4 py-2 dark:border-white/10 sm:px-5">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search messages..."
                className="h-9 border-border/60 bg-background/80 text-sm placeholder:text-foreground/45 dark:border-white/15 dark:bg-white/[0.04] dark:placeholder:text-white/45"
              />
            </div>

            <div
              ref={listRef}
              className="chat-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-6"
            >
              <div className="mx-auto w-full max-w-4xl space-y-3">
                {filteredMessages.length === 0 ? (
                  <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/70 px-6 text-center text-sm text-foreground/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
                    No messages found. Start the conversation.
                  </div>
                ) : (
                  filteredMessages.map((message) => {
                    const authorName = message.user.name || "Unknown";
                    const avatarFallback = authorName.slice(0, 1).toUpperCase();
                    const isMine =
                      (selfParticipant &&
                        message.user.id === selfParticipant.id) ||
                      (!selfParticipant &&
                        Boolean(user?.id) &&
                        message.user.id === user?.id);

                    return (
                      <article
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[92%] sm:max-w-[78%] ${
                            isMine
                              ? "rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-brand-ink"
                              : "rounded-2xl rounded-bl-md border border-border/60 bg-background/85 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.04]"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-[11px]">
                            {!isMine ? (
                              <Avatar className="h-6 w-6 border border-border/60 dark:border-white/15">
                                <AvatarImage
                                  src={message.user.avatar || undefined}
                                  alt={authorName}
                                />
                                <AvatarFallback>
                                  {avatarFallback}
                                </AvatarFallback>
                              </Avatar>
                            ) : null}
                            <span
                              className={`font-semibold ${
                                isMine
                                  ? "text-brand-ink/90"
                                  : "text-foreground/90 dark:text-white/90"
                              }`}
                            >
                              {isMine ? "You" : authorName}
                            </span>
                            <span
                              className={
                                isMine
                                  ? "text-brand-ink/75"
                                  : "text-foreground/45 dark:text-white/45"
                              }
                            >
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <p
                            className={`break-words text-sm leading-relaxed ${
                              isMine
                                ? "text-brand-ink"
                                : "text-foreground/82 dark:text-white/82"
                            }`}
                          >
                            {message.text}
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <footer className="border-t border-border/60 px-3 py-3 dark:border-white/10 sm:px-5">
              <div className="mx-auto w-full max-w-4xl">
                <div className="flex items-center gap-2">
                  <Input
                    value={draft}
                    onChange={(event) =>
                      setDraft(event.target.value.slice(0, MAX_DRAFT_LENGTH))
                    }
                    placeholder="Write a message..."
                    className="h-11 border-border/60 bg-background/85 text-sm placeholder:text-foreground/45 dark:border-white/15 dark:bg-white/[0.04] dark:placeholder:text-white/45"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={sendMessage}
                    disabled={!isConnected || !draft.trim()}
                    className="h-11 bg-brand px-4 text-brand-ink shadow-[0_14px_35px_rgba(243,213,149,0.32)] hover:bg-brand-soft"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-foreground/55 dark:text-white/55">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircleMore className="h-3.5 w-3.5" />
                    Press Enter to send
                  </span>
                  <span>
                    {draft.length}/{MAX_DRAFT_LENGTH}
                  </span>
                </div>
              </div>

              {errorMessage ? (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">
                  {errorMessage}
                </p>
              ) : null}
            </footer>
          </div>

          <aside
            className={`min-h-0 w-full flex-col border-t border-border/60 dark:border-white/10 lg:w-[320px] lg:border-l lg:border-t-0 ${
              activeTab === "chat" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="border-b border-border/60 px-4 py-3 dark:border-white/10">
              <p className="text-[10px] uppercase tracking-[0.24em] text-foreground/50 dark:text-white/50">
                Participants
              </p>
              <p className="mt-1 text-xs text-foreground/60 dark:text-white/60">
                {participants.length} active users in this room
              </p>
            </div>
            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-1.5">
                {participants.slice(0, 120).map((participant) =>
                  participant.guest ||
                  !isAuthenticated ||
                  participant.id === (selfParticipant?.id ?? user?.id) ? (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-foreground/5 dark:hover:bg-white/10"
                    >
                      <Avatar className="h-8 w-8 border border-border/60 dark:border-white/15">
                        <AvatarImage src={participant.avatar || undefined} />
                        <AvatarFallback>
                          {participant.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 truncate text-sm">
                        {participant.name}
                      </p>
                    </div>
                  ) : (
                    <Link
                      key={participant.id}
                      to={`/chat/dm/${participant.id}`}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-foreground/5 dark:hover:bg-white/10"
                    >
                      <Avatar className="h-8 w-8 border border-border/60 dark:border-white/15">
                        <AvatarImage src={participant.avatar || undefined} />
                        <AvatarFallback>
                          {participant.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 truncate text-sm">
                        {participant.name}
                      </p>
                    </Link>
                  ),
                )}
                {!participants.length ? (
                  <p className="px-2 text-xs text-foreground/50 dark:text-white/50">
                    No participants yet.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
