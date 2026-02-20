import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { BookOpen, Feather, Layers, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="relative text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(244,208,131,0.24),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,#f8f3e8,#fffdf9)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(244,208,131,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(0deg,rgba(0,0,0,0.12)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 md:py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-foreground/50 dark:text-white/50">
              About Things
            </p>
            <h1 className="mt-5 text-4xl font-[var(--font-editorial)] tracking-wide md:text-6xl">
              A premium workspace built for modern storytelling.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-foreground/65 dark:text-white/60 md:text-base">
              Things helps writers build worlds, organize chapters, and publish
              with clarity. We focus on calm design, elegant tools, and the
              discipline of long-form craft.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
              >
                <Link to="/chat/public">Open public chat</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Link to="/chat/dm">Open direct messages</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border/60 bg-background/80 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.25)] backdrop-blur-[2px] dark:border-white/10 dark:bg-[#0e1117]/90 dark:shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 dark:text-white/50">
              Studio Promise
            </p>
            <h2 className="mt-3 text-2xl font-[var(--font-editorial)]">
              Clarity, cadence, and craft.
            </h2>
            <p className="mt-3 text-sm text-foreground/65 dark:text-white/60">
              Every surface is designed to remove friction so you can focus on
              the story. We believe in a quiet interface that makes your writing
              feel intentional and premium.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Distraction-free drafting",
                "Structured series planning",
                "Elegant reading flow",
                "Consistent publishing rhythm",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground/75 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Feather,
              title: "Craft",
              detail: "Write in a space that feels like a studio, not a tool.",
            },
            {
              icon: Layers,
              title: "Structure",
              detail: "Plan story arcs, chapters, and episode flow with ease.",
            },
            {
              icon: BookOpen,
              title: "Publish",
              detail: "Deliver a premium reading experience for your audience.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border/60 bg-background/75 p-6 shadow-[0_24px_55px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_70px_rgba(0,0,0,0.35)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/70 dark:border-white/10 dark:bg-white/5">
                <item.icon className="h-5 w-5 text-brand" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-foreground/65 dark:text-white/60">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/75 p-8 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 dark:text-white/50">
                Designed for writers
              </p>
              <h2 className="mt-3 text-2xl font-[var(--font-editorial)]">
                Make your next story unforgettable.
              </h2>
              <p className="mt-2 text-sm text-foreground/65 dark:text-white/60">
                Build a consistent practice and ship your next chapter with
                confidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Link to="/chat/people">Find people</Link>
              </Button>
              <Button
                asChild
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
              >
                <Link to="/chat/public">Join now</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/80 p-10 text-center shadow-[0_24px_55px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-[#0e1117]/90 dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
          <Sparkles className="mx-auto h-6 w-6 text-brand" />
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-foreground/50 dark:text-white/50">
            Premium by design
          </p>
          <p className="mt-4 text-lg text-foreground/85 dark:text-white/80">
            “A calm interface that helps writers build worlds, one chapter at a
            time.”
          </p>
        </section>
      </div>
    </div>
  );
}
