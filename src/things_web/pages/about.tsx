import { Button } from "../components/ui/button";
import { Link } from "react-router";
import {
  BookOpen,
  Compass,
  Feather,
  Layers,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(201,160,91,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(84,124,189,0.16),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(0deg,rgba(12,22,36,0.08)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(236,226,208,0.09)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="flex w-full flex-col gap-12 px-3 py-10 sm:px-4 md:px-6 md:py-14 xl:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="premium-muted text-xs uppercase tracking-[0.45em]">
              About Things
            </p>
            <h1 className="mt-5 text-4xl font-[var(--font-editorial)] tracking-wide md:text-6xl">
              Build stories in a workspace that feels intentional.
            </h1>
            <p className="premium-muted mt-4 max-w-2xl text-sm md:text-base">
              Things helps writers build worlds, organize chapters, and publish
              with clarity. We focus on calm design, elegant tools, and the
              discipline of long-form craft.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
              >
                <Link to="/create-story">Start writing</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-border/70 bg-card/65 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
              >
                <Link to="/series">Explore series</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Stories published", value: "5k+" },
                { label: "Active writers", value: "12k+" },
                { label: "Monthly readers", value: "80k+" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="premium-panel rounded-2xl p-4"
                >
                  <p className="text-2xl font-semibold text-brand-strong">{item.value}</p>
                  <p className="premium-muted mt-1 text-xs uppercase tracking-[0.18em]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-panel rounded-[2.5rem] p-8">
            <p className="premium-muted text-xs uppercase tracking-[0.3em]">
              Studio Promise
            </p>
            <h2 className="mt-3 text-2xl font-[var(--font-editorial)]">
              Clarity, cadence, and craft.
            </h2>
            <p className="premium-muted mt-3 text-sm">
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
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground/75"
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
              className="premium-panel rounded-3xl p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/70">
                <item.icon className="h-5 w-5 text-brand" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="premium-muted mt-2 text-sm">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="premium-panel rounded-3xl p-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Compass,
                title: "Vision",
                detail: "Help writers build sustainable publishing rhythm.",
              },
              {
                icon: Target,
                title: "Mission",
                detail: "Turn story planning and publishing into one clean flow.",
              },
              {
                icon: Star,
                title: "Principle",
                detail: "Calm interface, fast tools, premium readability.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/70 bg-background/70 p-5"
              >
                <item.icon className="h-5 w-5 text-brand" />
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="premium-muted mt-1.5 text-sm">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-panel rounded-3xl p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="premium-muted text-xs uppercase tracking-[0.3em]">
                Designed for writers
              </p>
              <h2 className="mt-3 text-2xl font-[var(--font-editorial)]">
                Make your next story unforgettable.
              </h2>
              <p className="premium-muted mt-2 text-sm">
                Build a consistent practice and ship your next chapter with
                confidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-border/70 bg-card/65 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
              >
                <Link to="/stories">Read stories</Link>
              </Button>
              <Button
                asChild
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
              >
                <Link to="/create-story">Start a draft</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="premium-panel rounded-3xl p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-brand" />
          <p className="premium-muted mt-4 text-sm uppercase tracking-[0.3em]">
            Premium by design
          </p>
          <p className="mt-4 text-lg text-foreground/85">
            “A calm interface that helps writers build worlds, one chapter at a
            time.”
          </p>
        </section>
      </div>
    </div>
  );
}
