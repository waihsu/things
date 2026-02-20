import { ArrowRight, MessageCircle, Sparkles, UserRoundSearch, UsersRound } from "lucide-react";
import { Link } from "react-router";

const cards = [
  {
    title: "Public Room",
    description: "Open conversation for everyone online.",
    to: "/chat/public",
    icon: MessageCircle,
  },
  {
    title: "Direct Messages",
    description: "Private chat between two users.",
    to: "/chat/dm",
    icon: UsersRound,
  },
  {
    title: "People",
    description: "Find users and start a private thread.",
    to: "/chat/people",
    icon: UserRoundSearch,
  },
];

export default function ChatHomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="rounded-3xl border border-border/60 bg-background/70 p-6 shadow-[0_20px_65px_rgba(14,20,34,0.16)] dark:border-white/10 dark:bg-white/[0.03]">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-foreground/55 dark:text-white/55">
          <Sparkles className="h-3.5 w-3.5" />
          Things Chat
        </p>
        <h1 className="mt-3 text-3xl font-[var(--font-editorial)] sm:text-4xl">
          Choose how you want to chat
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/65 dark:text-white/65">
          Public room for community discussion, or direct messages for one-to-one conversations.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-3xl border border-border/60 bg-background/80 p-5 transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_18px_40px_rgba(14,20,34,0.14)] dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/70 dark:border-white/15 dark:bg-white/[0.04]">
              <card.icon className="h-5 w-5 text-brand-strong" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-foreground/65 dark:text-white/65">
              {card.description}
            </p>
            <p className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 group-hover:text-foreground dark:text-white/70 dark:group-hover:text-white">
              Open
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
