import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { MessageSquareText, Search, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";

type ChatUser = {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
};

export default function ChatPeoplePage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedSearch = useMemo(() => search.trim(), [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const params = new URLSearchParams({
          limit: "48",
        });
        if (normalizedSearch) {
          params.set("search", normalizedSearch);
        }

        const response = await fetch(`/api/v1/chat/users?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const payload = (await response.json()) as { users?: ChatUser[] };
        setUsers(Array.isArray(payload.users) ? payload.users : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[chat] users fetch failed:", error);
        setErrorMessage("Unable to load people right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedSearch]);

  return (
    <div className="chat-surface flex h-full min-h-0 w-full flex-col rounded-3xl border border-border/60 bg-background/80 shadow-[0_18px_55px_rgba(14,20,34,0.14)] dark:border-white/10 dark:bg-white/[0.03]">
      <header className="border-b border-border/60 px-4 py-4 dark:border-white/10 sm:px-5">
        <p className="text-[10px] uppercase tracking-[0.34em] text-foreground/55 dark:text-white/55">
          Directory
        </p>
        <h1 className="mt-1 text-2xl font-[var(--font-editorial)]">Find People</h1>
        <p className="mt-1 text-sm text-foreground/65 dark:text-white/65">
          Search users and start a direct conversation.
        </p>
      </header>

      <div className="border-b border-border/60 px-4 py-3 dark:border-white/10 sm:px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50 dark:text-white/50" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or username..."
            className="h-10 border-border/60 bg-background/80 pl-9 text-sm dark:border-white/15 dark:bg-white/[0.04]"
          />
        </div>
      </div>

      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {loading ? (
          <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-foreground/55 dark:text-white/55">
            Loading people...
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && users.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/70 text-sm text-foreground/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
            No users found.
          </div>
        ) : null}

        {!loading && !errorMessage && users.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((person) => (
              <article
                key={person.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/60 dark:border-white/15">
                    <AvatarImage src={person.avatar || undefined} alt={person.name} />
                    <AvatarFallback>
                      {person.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{person.name}</p>
                    <p className="truncate text-xs text-foreground/55 dark:text-white/55">
                      {person.username ? `@${person.username}` : person.id}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to={`/chat/dm/${person.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-soft"
                  >
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Message
                  </Link>
                  <Link
                    to={`/profile/${person.username || person.id}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-border/60 px-3 py-2 text-xs text-foreground/70 hover:bg-foreground/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
