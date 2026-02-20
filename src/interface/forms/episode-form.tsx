import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
  name: z.string().min(3),
  paragraph: z.string().min(50),
  order: z.coerce.number().int().min(1),
});

type EpisodeFormValues = z.infer<typeof schema>;

interface EpisodeFormProps {
  onSubmit: (values: EpisodeFormValues) => void;
  submitLabel?: string;
  defaultValues?: Partial<EpisodeFormValues>;
  seriesName?: string;
}

const meter = (value: number, max: number) =>
  Math.max(0, Math.min(100, Math.round((value / max) * 100)));

export function EpisodeForm({
  onSubmit,
  submitLabel = "Publish Chapter",
  defaultValues,
  seriesName,
}: EpisodeFormProps) {
  const form = useForm<EpisodeFormValues>({
    resolver: zodResolver(schema) as Resolver<EpisodeFormValues>,
    defaultValues: {
      name: defaultValues?.name ?? "",
      paragraph: defaultValues?.paragraph ?? "",
      order: typeof defaultValues?.order === "number" ? defaultValues.order : 1,
    },
  });

  const name = form.watch("name") || "";
  const paragraph = form.watch("paragraph") || "";
  const order = form.watch("order") || 1;

  const stats = useMemo(() => {
    const words = paragraph.trim() ? paragraph.trim().split(/\s+/).length : 0;
    return {
      words,
      nameMeter: meter(name.length, 70),
      contentMeter: meter(paragraph.length, 900),
      order,
    };
  }, [name, paragraph, order]);

  return (
    <div className="relative mx-autofont-[var(--font-body)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(244,208,131,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <Card className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e1117]/90 shadow-[0_46px_100px_rgba(0,0,0,0.62)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_15%_20%,rgba(243,213,149,0.08),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(109,213,181,0.06),transparent_45%)]" />

        <CardHeader className="relative z-10 px-8 pb-4 pt-8">
          <CardTitle className="text-3xl font-[var(--font-editorial)] tracking-wide text-white md:text-4xl">
            Chapter Draft
          </CardTitle>
          <CardDescription className="mt-2 max-w-xl text-white/60">
            {seriesName
              ? `Series: ${seriesName}`
              : "Write the next chapter with strong momentum."}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 grid gap-8 px-8 pb-10 pt-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField<EpisodeFormValues>
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                        Chapter Title
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {name.length}/120
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Eg: The Quiet Door"
                        maxLength={120}
                        {...field}
                        className="h-12 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-lg font-[var(--font-editorial)] text-white placeholder:text-white/30 focus-visible:border-brand focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<EpisodeFormValues>
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                      Chapter Order
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        className="h-12 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-white/30 focus-visible:border-brand focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormDescription className="text-white/50">
                      Sequence number in this series.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<EpisodeFormValues>
                control={form.control}
                name="paragraph"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm uppercase tracking-[0.2em] text-white/60">
                        Paragraph
                      </FormLabel>
                      <span className="text-xs text-white/45">
                        {stats.words} words
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Write the full chapter..."
                        className="min-h-[280px] rounded-2xl border border-white/10 bg-white/[0.05] text-base text-white placeholder:text-white/30 leading-relaxed shadow-inner focus-visible:border-brand focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
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
              Chapter Metrics
            </p>
            {[
              {
                label: "Title signal",
                value: stats.nameMeter,
                color: "bg-brand",
              },
              {
                label: "Narrative depth",
                value: stats.contentMeter,
                color: "bg-emerald-300",
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
                Position
              </p>
              <p className="mt-2">
                This will be chapter #{stats.order} in the arc.
              </p>
            </div>
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}
