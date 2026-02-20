import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/src/things_web/components/ui/form";
import { Input } from "@/src/things_web/components/ui/input";
import { Textarea } from "@/src/things_web/components/ui/textarea";
import { Button } from "@/src/things_web/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/src/things_web/components/ui/card";

const schema = z.object({
  title: z.string().min(3),
  summary: z.string().min(20).optional().or(z.literal("")),
  content: z.string().min(50),
  category_ids: z.array(z.string()).min(1),
});

interface StoryFormProps {
  categories: { id: string; name: string }[];
  onSubmit: (values: z.infer<typeof schema>) => void;
  submitLabel?: string;
  defaultValues?: Partial<z.infer<typeof schema>>;
}

const meter = (value: number, max: number) =>
  Math.max(0, Math.min(100, Math.round((value / max) * 100)));

export function StoryCreateForm({
  categories,
  onSubmit,
  submitLabel = "Publish Story",
  defaultValues,
}: StoryFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      category_ids: [],
      ...defaultValues,
    },
  });

  const title = form.watch("title") || "";
  const summary = form.watch("summary") || "";
  const content = form.watch("content") || "";
  const selected = form.watch("category_ids") || [];

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return {
      words,
      titleMeter: meter(title.length, 70),
      summaryMeter: meter(summary.length, 220),
      contentMeter: meter(content.length, 900),
      selectedCount: selected.length,
    };
  }, [title, summary, content, selected]);

  return (
    <div className="relative mx-auto  font-[var(--font-body)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(244,208,131,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <Card className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e1117]/90 shadow-[0_46px_100px_rgba(0,0,0,0.62)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_15%_20%,rgba(243,213,149,0.08),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(109,213,181,0.06),transparent_45%)]" />

        <CardHeader className="relative z-10 px-8 pb-4 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-[var(--font-editorial)] tracking-wide text-white md:text-4xl">
                Story Draft Studio
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-white/60">
                Build your narrative with clear title, strong summary, and deep
                content.
              </CardDescription>
            </div>
            <div className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
              Narrative Editor
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 grid gap-8 px-8 pb-10 pt-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                        Story Title
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {title.length}/120
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Eg: The Last Lantern"
                        maxLength={120}
                        {...field}
                        className="h-12 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-lg font-[var(--font-editorial)] text-white placeholder:text-white/30 focus-visible:border-brand focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormDescription className="text-white/50">
                      Keep it memorable and searchable.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                        Summary
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {summary.length} chars
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="One or two lines that capture the heart of the story..."
                        className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.05] text-base text-white placeholder:text-white/30 leading-relaxed shadow-inner focus-visible:border-brand focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                        Content
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {stats.words} words
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Write your story..."
                        className="min-h-[280px] rounded-2xl border border-white/10 bg-white/[0.05] text-base text-white placeholder:text-white/30 leading-relaxed shadow-inner focus-visible:border-brand focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_ids"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                        Genre Shelf
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {stats.selectedCount} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => {
                        const checked = field.value?.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            className={`
                              cursor-pointer select-none rounded-full border px-4 py-1.5 text-sm font-medium transition-all
                              ${
                                checked
                                  ? "border-brand bg-brand text-brand-ink shadow-md shadow-brand/20"
                                  : "border-white/15 bg-white/5 text-white/70 hover:border-brand/60 hover:text-white"
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([
                                    ...(field.value ?? []),
                                    category.id,
                                  ]);
                                } else {
                                  field.onChange(
                                    (field.value ?? []).filter(
                                      (id) => id !== category.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            {category.name}
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-brand text-sm uppercase tracking-[0.3em] text-brand-ink shadow-lg shadow-brand/20 hover:bg-brand-soft"
              >
                {submitLabel}
              </Button>
            </form>
          </Form>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:sticky lg:top-24 lg:h-fit">
            <p className="text-xs uppercase tracking-[0.25em] text-white/55">
              Draft Health
            </p>

            {[
              {
                label: "Title clarity",
                value: stats.titleMeter,
                color: "bg-brand",
              },
              {
                label: "Summary depth",
                value: stats.summaryMeter,
                color: "bg-emerald-300",
              },
              {
                label: "Content depth",
                value: stats.contentMeter,
                color: "bg-sky-300",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-white/55">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className={`h-full ${item.color}`}
                    animate={{ width: `${item.value}%` }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  />
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Quick Advice
              </p>
              <p className="mt-2">
                Open with tension, close each section with momentum.
              </p>
            </div>
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}
