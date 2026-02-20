import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useMatch } from "react-router";
import { Search, UserRoundSearch, Wifi, WifiOff } from "lucide-react";
import { useAuthStore } from "@/src/store/use-auth-store";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import {
  type ChatUser,
  type Conversation,
  type DirectMessage,
  parseDirectEvent,
  formatTime,
  upsertConversationWithMessage,
} from "./direct-messages-shared";

export type DirectMessagesOutletContext = {
  activeUserId: string | null;
  currentUserId: string;
  isConnected: boolean;
  errorMessage: string | null;
  conversations: Conversation[];
  lastIncomingMessage: DirectMessage | null;
  sendDirectMessage: (input: { toUserId: string; text: string }) => boolean;
  ensureConversationTarget: (
    target: ChatUser,
    latest?: DirectMessage | null,
  ) => void;
};

export default function DirectMessagesLayout() {
  const { user } = useAuthStore();
  const threadMatch = useMatch("/chat/dm/:userId");
  const activeUserId = threadMatch?.params.userId ?? null;
  const isThreadOpen = Boolean(activeUserId);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchUsers, setSearchUsers] = useState<ChatUser[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastIncomingMessage, setLastIncomingMessage] =
    useState<DirectMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const currentUserId = user?.id ?? "";
  const isShowingSearchList = contactQuery.trim().length > 0;

  const fallbackName = useMemo(() => {
    if (user?.name?.trim()) return user.name.trim();
    const emailName = user?.email?.split("@")[0]?.trim();
    if (emailName) return emailName;
    return "Member";
  }, [user?.email, user?.name]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const response = await fetch("/api/v1/chat/conversations?limit=80");
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }
        const payload = (await response.json()) as {
          conversations?: Conversation[];
        };
        setConversations(
          Array.isArray(payload.conversations) ? payload.conversations : [],
        );
      } catch (error) {
        console.error("[chat] failed to load conversations:", error);
        setErrorMessage("Unable to load conversations.");
      } finally {
        setLoadingConversations(false);
      }
    };

    void loadConversations();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "24" });
        const normalized = contactQuery.trim();
        if (normalized) {
          params.set("search", normalized);
        }

        const response = await fetch(
          `/api/v1/chat/users?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const payload = (await response.json()) as { users?: ChatUser[] };
        setSearchUsers(Array.isArray(payload.users) ? payload.users : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[chat] failed to load users:", error);
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [contactQuery]);

  useEffect(() => {
    if (!currentUserId) return;
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
        setErrorMessage(
          "Realtime direct message connection lost. Reconnecting...",
        );
      };

      ws.onmessage = (event) => {
        const parsed = parseDirectEvent(String(event.data));
        if (!parsed) return;

        if (parsed.type === "chat:error") {
          setErrorMessage(parsed.payload.message);
          return;
        }

        if (parsed.type !== "chat:dm") {
          return;
        }

        const incoming = parsed.payload;
        if (
          incoming.sender.id !== currentUserId &&
          incoming.recipient.id !== currentUserId
        ) {
          return;
        }

        setConversations((current) =>
          upsertConversationWithMessage(current, incoming, currentUserId),
        );
        setLastIncomingMessage(incoming);
      };
    };

    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = null;
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [currentUserId, fallbackName]);

  const sendDirectMessage = useCallback(
    (input: { toUserId: string; text: string }) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        setErrorMessage("Realtime connection is not ready.");
        return false;
      }

      ws.send(
        JSON.stringify({
          type: "chat:dm",
          to_user_id: input.toUserId,
          text: input.text,
        }),
      );
      return true;
    },
    [],
  );

  const ensureConversationTarget = useCallback(
    (target: ChatUser, latest?: DirectMessage | null) => {
      setConversations((current) => {
        const index = current.findIndex((item) => item.user.id === target.id);
        if (index !== -1) {
          return current;
        }

        const fallbackMessage = latest
          ? {
              id: latest.id,
              text: latest.text,
              created_at: latest.created_at,
              sender_user_id: latest.sender.id,
            }
          : {
              id: `pending-${target.id}`,
              text: "Start a conversation",
              created_at: new Date().toISOString(),
              sender_user_id: target.id,
            };

        return [{ user: target, last_message: fallbackMessage }, ...current];
      });
    },
    [],
  );

  const listItems = isShowingSearchList
    ? searchUsers
    : conversations.map((conversation) => conversation.user);

  const outletContext: DirectMessagesOutletContext = {
    activeUserId,
    currentUserId,
    isConnected,
    errorMessage,
    conversations,
    lastIncomingMessage,
    sendDirectMessage,
    ensureConversationTarget,
  };

  return (
    <div className="h-full min-h-0">
      <div className="flex h-full min-h-0 gap-3">
        <aside
          className={cn(
            "chat-surface min-h-0 flex-col rounded-3xl border border-border/60 bg-background/80 shadow-[0_18px_50px_rgba(14,20,34,0.14)] dark:border-white/10 dark:bg-white/[0.03]",
            isThreadOpen
              ? "hidden lg:flex lg:w-[360px] xl:w-[390px]"
              : "flex w-full lg:w-[360px] xl:w-[390px]",
          )}
        >
        <div className="border-b border-border/60 px-4 py-4 dark:border-white/10">
          <p className="text-[10px] uppercase tracking-[0.34em] text-foreground/55 dark:text-white/55">
            Private
          </p>
          <h1 className="mt-1 text-xl font-semibold">Direct Messages</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-foreground/60 dark:text-white/60">
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected ? "Realtime connected" : "Realtime reconnecting"}
          </div>
          <p className="mt-2 text-xs text-foreground/55 dark:text-white/55">
            {conversations.length} recent thread
            {conversations.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="border-b border-border/60 p-3 dark:border-white/10">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50 dark:text-white/50" />
            <Input
              value={contactQuery}
              onChange={(event) => setContactQuery(event.target.value)}
              placeholder="Search users..."
              className="h-10 border-border/60 bg-background/85 pl-9 text-sm dark:border-white/15 dark:bg-white/[0.04]"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Link
              to="/chat/people"
              className="inline-flex items-center gap-1 text-xs text-foreground/65 hover:text-foreground dark:text-white/65 dark:hover:text-white"
            >
              <UserRoundSearch className="h-3.5 w-3.5" />
              Open people directory
            </Link>
            <Link
              to="/chat/public"
              className="text-xs text-foreground/60 underline-offset-4 hover:underline dark:text-white/60"
            >
              Public Room
            </Link>
          </div>
        </div>

          <div className="chat-scroll min-h-0 flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-foreground/50 dark:text-white/50">
              {isShowingSearchList ? "Search Result" : "Recent Threads"}
            </p>

          {loadingConversations && !isShowingSearchList ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-6 text-center text-xs text-foreground/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
              Loading conversations...
            </div>
          ) : null}

          <div className="space-y-2">
            {listItems.map((person) => {
              const active = activeUserId === person.id;
              const summary = conversations.find(
                (item) => item.user.id === person.id,
              )?.last_message;

              return (
                <Link
                  key={person.id}
                  to={`/chat/dm/${person.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-2.5",
                    active
                      ? "border-brand/45 bg-brand/12"
                      : "border-border/60 bg-background/70 hover:bg-foreground/5 dark:border-white/15 dark:bg-white/[0.03] dark:hover:bg-white/10",
                  )}
                >
                  <Avatar className="h-10 w-10 border border-border/60 dark:border-white/15">
                    <AvatarImage
                      src={person.avatar || undefined}
                      alt={person.name}
                    />
                    <AvatarFallback>
                      {person.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {person.name}
                    </p>
                    <p className="truncate text-xs text-foreground/55 dark:text-white/55">
                      {summary?.text ||
                        (person.username ? `@${person.username}` : person.id)}
                    </p>
                  </div>
                  {summary ? (
                    <span className="text-[11px] text-foreground/45 dark:text-white/45">
                      {formatTime(summary.created_at)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {!loadingConversations &&
          (isShowingSearchList
            ? searchUsers.length === 0
            : conversations.length === 0) ? (
            <div className="mt-2 rounded-2xl border border-dashed border-border/60 bg-background/70 px-3 py-5 text-center text-xs text-foreground/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
              {isShowingSearchList
                ? "No users found."
                : "No direct messages yet. Search a user to start."}
            </div>
          ) : null}
          </div>
        </aside>

        {isThreadOpen ? (
          <section className="chat-surface flex h-full min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-background/80 shadow-[0_18px_50px_rgba(14,20,34,0.14)] dark:border-white/10 dark:bg-black/25">
            <Outlet context={outletContext} />
          </section>
        ) : (
          <section className="hidden h-full min-h-0 flex-1 items-center justify-center rounded-3xl border border-dashed border-border/60 bg-background/70 px-6 text-center text-sm text-foreground/55 lg:flex dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
            Select a conversation to start chatting.
          </section>
        )}
      </div>
    </div>
  );
}
