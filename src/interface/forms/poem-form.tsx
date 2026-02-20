import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/things_web/components/ui/form";
import { Input } from "@/src/things_web/components/ui/input";
import { Textarea } from "@/src/things_web/components/ui/textarea";
import { Button } from "@/src/things_web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/things_web/components/ui/card";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(20, "Content should be at least 20 characters"),
  category_ids: z.array(z.string()).min(1, "Select at least one category"),
  tags_text: z
    .string()
    .max(320, "Tags are too long")
    .optional()
    .or(z.literal("")),
});

type PoemFormRawValues = z.infer<typeof schema>;
export type PoemFormValues = {
  title: string;
  content: string;
  category_ids: string[];
  tags: string[];
};

interface PoemFormProps {
  categories: { id: string; name: string }[];
  onSubmit: (values: PoemFormValues) => void;
  submitLabel?: string;
  defaultValues?: Partial<PoemFormValues>;
}

const meter = (value: number, max: number) =>
  Math.max(0, Math.min(100, Math.round((value / max) * 100)));

const parseTags = (tagsText: string) => {
  return Array.from(
    new Set(
      tagsText
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length <= 60),
    ),
  ).slice(0, 15);
};

export function PoemForm({
  categories,
  onSubmit,
  submitLabel = "Publish Poem",
  defaultValues,
}: PoemFormProps) {
  const form = useForm<PoemFormRawValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      category_ids: defaultValues?.category_ids ?? [],
      tags_text: defaultValues?.tags?.join(", ") ?? "",
    },
  });

  const titleValue = form.watch("title") || "";
  const contentValue = form.watch("content") || "";
  const selectedCategories = form.watch("category_ids") || [];
  const tagsText = form.watch("tags_text") || "";
  const parsedTags = useMemo(() => parseTags(tagsText), [tagsText]);

  const stats = useMemo(() => {
    const words = contentValue.trim()
      ? contentValue.trim().split(/\s+/).length
      : 0;
    const lines = contentValue.trim() ? contentValue.split("\n").length : 0;
    const excerpt =
      contentValue.trim().slice(0, 120) +
      (contentValue.trim().length > 120 ? "..." : "");

    return {
      words,
      lines,
      excerpt,
      titleMeter: meter(titleValue.length, 48),
      contentMeter: meter(contentValue.length, 420),
      selectedCategories: selectedCategories.length,
      tagsCount: parsedTags.length,
    };
  }, [titleValue, contentValue, selectedCategories.length, parsedTags.length]);

  return (
    <div className="relative mx-auto w-full">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(243,213,149,0.2),transparent_42%),radial-gradient(circle_at_86%_10%,rgba(109,213,181,0.16),transparent_46%),linear-gradient(180deg,#0a0b10,#111522_48%,#0b0c12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:100%_28px]" />
      </div>

      <Card className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e1117]/90 shadow-[0_46px_100px_rgba(0,0,0,0.62)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:radial-gradient(circle_at_15%_20%,rgba(243,213,149,0.09),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(109,213,181,0.07),transparent_44%)]" />

        <CardHeader className="relative z-10 px-8 pb-4 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                Poetry Editor
              </p>
              <CardTitle className="mt-3 text-3xl font-[var(--font-editorial)] tracking-wide text-white md:text-4xl">
                Compose with focus
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-white/60">
                Keep poem writing focused, then add category and tags for better
                discovery.
              </CardDescription>
            </div>
            <div className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
              Verse Studio
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 grid gap-8 px-8 pb-10 pt-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit((values) => {
                onSubmit({
                  title: values.title,
                  content: values.content,
                  category_ids: values.category_ids,
                  tags: parseTags(values.tags_text ?? ""),
                });
              })}
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.25em] text-white/60">
                        Title
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {titleValue.length}/80
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={80}
                        placeholder="Poem title"
                        className="h-12 rounded-xl border-white/15 bg-white/[0.05] text-lg text-white placeholder:text-white/35 focus-visible:border-brand focus-visible:ring-0"
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
                      <FormLabel className="text-sm uppercase tracking-[0.25em] text-white/60">
                        Content
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {contentValue.length} chars
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write your poem..."
                        className="min-h-[340px] rounded-2xl border-white/15 bg-white/[0.05] text-base text-white placeholder:text-white/35 leading-relaxed focus-visible:border-brand focus-visible:ring-0"
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
                      <FormLabel className="text-sm uppercase tracking-[0.25em] text-white/60">
                        Categories
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {selectedCategories.length} selected
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
                              onChange={(event) => {
                                if (event.target.checked) {
                                  field.onChange([
                                    ...(field.value ?? []),
                                    category.id,
                                  ]);
                                  return;
                                }

                                field.onChange(
                                  (field.value ?? []).filter(
                                    (id) => id !== category.id,
                                  ),
                                );
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

              <FormField
                control={form.control}
                name="tags_text"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.25em] text-white/60">
                        Tags
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {parsedTags.length} tags
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="love, city, rain, midnight"
                        className="h-12 rounded-xl border-white/15 bg-white/[0.05] text-white placeholder:text-white/35 focus-visible:border-brand focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormDescription className="text-white/50">
                      Comma separated tags for discovery.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-brand text-sm font-semibold uppercase tracking-[0.28em] text-brand-ink shadow-[0_16px_35px_rgba(243,213,149,0.28)] hover:bg-brand-soft"
              >
                {submitLabel}
              </Button>
            </form>
          </Form>

          <aside className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:sticky lg:top-24 lg:h-fit">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/55">
                Live Metrics
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                    Words
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {stats.words}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                    Lines
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {stats.lines}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                    Category
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {stats.selectedCategories}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                    Tags
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {stats.tagsCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                Readiness
              </p>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-white/55">
                  <span>Title clarity</span>
                  <span>{stats.titleMeter}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full bg-brand"
                    animate={{ width: `${stats.titleMeter}%` }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-white/55">
                  <span>Content depth</span>
                  <span>{stats.contentMeter}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full bg-emerald-300"
                    animate={{ width: `${stats.contentMeter}%` }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                Preview Excerpt
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {stats.excerpt || "Your opening lines will appear here."}
              </p>
            </div>

            {parsedTags.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                  Parsed Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {parsedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-white/75"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}
