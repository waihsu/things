import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { ArrowLeft, SendHorizontal, Wifi, WifiOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import type { DirectMessagesOutletContext } from "./direct-messages-layout";
import {
  type ChatUser,
  type DirectMessage,
  MAX_DRAFT_LENGTH,
  formatTime,
  upsertDirectMessage,
} from "./direct-messages-shared";

export default function DirectThreadPage() {
  const { userId } = useParams();
  const {
    currentUserId,
    isConnected,
    errorMessage,
    lastIncomingMessage,
    sendDirectMessage,
    ensureConversationTarget,
  } = useOutletContext<DirectMessagesOutletContext>();

  const [target, setTarget] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageQuery, setMessageQuery] = useState("");
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setTarget(null);
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await fetch(`/api/v1/chat/direct/${userId}/messages?limit=120`);
        if (!response.ok) {
          throw new Error("Failed to fetch direct messages");
        }

        const payload = (await response.json()) as {
          target?: ChatUser;
          messages?: DirectMessage[];
        };
        const threadMessages = Array.isArray(payload.messages) ? payload.messages : [];
        const targetUser = payload.target ?? null;
        setTarget(targetUser);
        setMessages(threadMessages);

        if (targetUser) {
          ensureConversationTarget(targetUser, threadMessages[threadMessages.length - 1] ?? null);
        }
      } catch (error) {
        console.error("[chat] failed to load thread:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [userId, ensureConversationTarget]);

  useEffect(() => {
    if (!lastIncomingMessage || !userId) return;
    const counterpart =
      lastIncomingMessage.sender.id === currentUserId
        ? lastIncomingMessage.recipient
        : lastIncomingMessage.sender;

    if (counterpart.id !== userId) {
      return;
    }

    setTarget(counterpart);
    setMessages((current) => upsertDirectMessage(current, lastIncomingMessage));
  }, [currentUserId, lastIncomingMessage, userId]);

  const filteredMessages = useMemo(() => {
    const normalized = messageQuery.trim().toLowerCase();
    if (!normalized) return messages;

    return messages.filter((message) =>
      `${message.sender.name} ${message.recipient.name} ${message.text}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [messageQuery, messages]);

  useEffect(() => {
    const targetList = listRef.current;
    if (!targetList) return;
    targetList.scrollTop = targetList.scrollHeight;
  }, [filteredMessages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!target || !text) return;

    const sent = sendDirectMessage({
      toUserId: target.id,
      text: text.slice(0, MAX_DRAFT_LENGTH),
    });
    if (sent) {
      setDraft("");
    }
  };

  return (
    <>
      <header className="border-b border-border/60 px-4 py-3 dark:border-white/10 sm:px-5">
        {target ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/chat/dm"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 lg:hidden dark:border-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Avatar className="h-10 w-10 border border-border/60 dark:border-white/15">
                <AvatarImage src={target.avatar || undefined} alt={target.name} />
                <AvatarFallback>{target.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{target.name}</p>
                <p className="truncate text-xs text-foreground/55 dark:text-white/55">
                  {target.username ? `@${target.username}` : target.id}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to={`/profile/${target.username || target.id}`}
                className="rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/[0.04]"
              >
                View Profile
              </Link>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                  isConnected
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200"
                }`}
              >
                {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-[0.34em] text-foreground/55 dark:text-white/55">
              Direct Chat
            </p>
            <h2 className="mt-2 text-xl font-semibold">Loading conversation...</h2>
          </div>
        )}
      </header>

      <div className="border-b border-border/60 px-4 py-2 dark:border-white/10 sm:px-5">
        <Input
          value={messageQuery}
          onChange={(event) => setMessageQuery(event.target.value)}
          placeholder="Search in conversation..."
          className="h-9 border-border/60 bg-background/80 text-sm dark:border-white/15 dark:bg-white/[0.04]"
        />
      </div>

      <div
        ref={listRef}
        className="chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
      >
        <div className="mx-auto w-full max-w-4xl space-y-3">
          {loadingMessages ? (
            <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-foreground/55 dark:text-white/55">
              Loading conversation...
            </div>
          ) : null}

          {!loadingMessages && filteredMessages.length === 0 ? (
            <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/70 px-6 text-center text-sm text-foreground/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
              No messages yet. Start this conversation.
            </div>
          ) : null}

          {!loadingMessages &&
            filteredMessages.map((message) => {
              const isMine = currentUserId === message.sender.id;
              const authorName = isMine ? "You" : message.sender.name;
              return (
                <article key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[92%] sm:max-w-[78%] ${
                      isMine
                        ? "rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-brand-ink"
                        : "rounded-2xl rounded-bl-md border border-border/60 bg-background/85 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.04]"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px]">
                      <span
                        className={
                          isMine
                            ? "font-semibold text-brand-ink/90"
                            : "font-semibold text-foreground/90 dark:text-white/90"
                        }
                      >
                        {authorName}
                      </span>
                      <span className={isMine ? "text-brand-ink/75" : "text-foreground/45 dark:text-white/45"}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p
                      className={`break-words text-sm leading-relaxed ${
                        isMine ? "text-brand-ink" : "text-foreground/82 dark:text-white/82"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      <footer className="border-t border-border/60 px-4 py-3 dark:border-white/10 sm:px-5">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, MAX_DRAFT_LENGTH))}
              placeholder={target ? `Message ${target.name}...` : "Loading thread..."}
              disabled={!target}
              className="h-11 border-border/60 bg-background/85 text-sm dark:border-white/15 dark:bg-white/[0.04]"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!isConnected || !draft.trim() || !target}
              className="h-11 bg-brand px-4 text-brand-ink hover:bg-brand-soft"
            >
              <SendHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-foreground/55 dark:text-white/55">
            <span>{isConnected ? "Realtime on" : "Realtime reconnecting"}</span>
            <span>{draft.length}/{MAX_DRAFT_LENGTH}</span>
          </div>
        </div>
        {errorMessage ? (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{errorMessage}</p>
        ) : null}
      </footer>
    </>
  );
}
