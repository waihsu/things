"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Link as LinkIcon, Mail, MapPin, User } from "lucide-react";
import { Link } from "react-router";

import { useAuthStore } from "@/src/store/use-auth-store";
import { useGetProfile } from "@/src/queries/profile/api/use-get-profile";
import { useUpdateProfile } from "@/src/queries/profile/api/use-update-profile";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Display name is required."),
  username: z
    .string()
    .regex(
      /^[a-z0-9._-]+$/,
      "Use lowercase letters, numbers, dots, underscores, or hyphens.",
    )
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be under 30 characters.")
    .optional()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .url("Enter a valid image URL.")
    .or(z.literal(""))
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be under 500 characters.")
    .optional()
    .or(z.literal("")),
  phone_number: z
    .string()
    .max(30, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip_code: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  urls: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof schema>;

const emptyValues: ProfileFormValues = {
  name: "",
  username: "",
  avatar_url: "",
  bio: "",
  phone_number: "",
  street: "",
  city: "",
  state: "",
  zip_code: "",
  country: "",
  urls: "",
};

const toOptional = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseUrlsInput = (value?: string | null) => {
  if (!value) return [] as string[];
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export function ProfilePage() {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuthStore();
  const { data: profile, isLoading, isError, refetch } = useGetProfile();
  const { mutateAsync, isPending } = useUpdateProfile();

  const defaultValues = useMemo<ProfileFormValues>(() => {
    return {
      name: profile?.name ?? profile?.user.name ?? user?.name ?? "",
      username: profile?.user.username ?? "",
      avatar_url:
        profile?.avatar_url ?? profile?.user.image ?? user?.image ?? "",
      bio: profile?.bio ?? "",
      phone_number: profile?.phone_number ?? "",
      street: profile?.street ?? "",
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      zip_code: profile?.zip_code ?? "",
      country: profile?.country ?? "",
      urls: profile?.urls?.join(", ") ?? "",
    };
  }, [profile, user]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const watchedName = form.watch("name");
  const watchedUsername = form.watch("username");
  const watchedAvatar = form.watch("avatar_url");
  const watchedUrls = form.watch("urls");

  const displayName =
    watchedName || profile?.user.name || user?.name || "Writer";
  const displayUsername = watchedUsername || profile?.user?.username || "";
  const avatarPreview =
    watchedAvatar ||
    profile?.user.image ||
    user?.image ||
    "https://github.com/shadcn.png";
  const linkPreview = parseUrlsInput(watchedUrls);

  const updatedAt = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const onSubmit = async (values: ProfileFormValues) => {
    const urls = parseUrlsInput(values.urls);
    try {
      await mutateAsync({
        name: values.name.trim(),
        username: toOptional(values.username),
        avatar_url: toOptional(values.avatar_url),
        bio: toOptional(values.bio),
        phone_number: toOptional(values.phone_number),
        street: toOptional(values.street),
        city: toOptional(values.city),
        state: toOptional(values.state),
        zip_code: toOptional(values.zip_code),
        country: toOptional(values.country),
        urls: urls.length ? urls : null,
      });
      toast.success("Profile updated successfully!");
      form.reset(values);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
    }
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(243,213,149,0.2),transparent_40%),radial-gradient(circle_at_82%_10%,rgba(109,213,181,0.16),transparent_45%),linear-gradient(180deg,rgba(12,14,20,0.92),rgba(13,16,24,0.95)_40%,rgba(8,10,15,0.98))] dark:opacity-100 opacity-40" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(0deg,rgba(0,0,0,0.18)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-2 shadow-[0_15px_30px_rgba(0,0,0,0.25)]">
              <Avatar className="h-14 w-14">
                <AvatarImage src={avatarPreview} alt={displayName} />
                <AvatarFallback>
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Profile Studio
              </p>
              <h1 className="mt-2 text-3xl font-[var(--font-editorial)] tracking-wide">
                {displayName}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile?.user.email || user?.email || "No email"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 uppercase tracking-[0.3em]">
              Premium
            </span>
            {updatedAt ? <span>Updated {updatedAt}</span> : null}
            {profile?.user.id || user?.id ? (
              <Button
                asChild
                variant="outline"
                className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
              >
                <Link
                  to={`/profile/${displayUsername || profile?.user.id || user?.id}`}
                >
                  View public
                </Link>
              </Button>
            ) : null}
          </div>
        </motion.header>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-[var(--font-editorial)]">
                Edit profile
              </CardTitle>
              <CardDescription>
                Keep your public writer profile updated with a premium look.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {isError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  Unable to load your profile. Please try again.
                  <div className="mt-3">
                    <Button variant="outline" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 w-full animate-pulse rounded-2xl bg-muted/30" />
                  <div className="h-24 w-full animate-pulse rounded-2xl bg-muted/30" />
                  <div className="h-10 w-full animate-pulse rounded-2xl bg-muted/30" />
                </div>
              ) : (
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <div className="grid gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Display name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Your public author name"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="your-handle"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Public link: /profile/
                              {displayUsername || "your-handle"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="avatar_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Avatar URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Use a square image for best results.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Bio
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Tell readers about your writing style."
                                className="min-h-[140px] rounded-2xl border-border/60 bg-background/60 px-4 py-3"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="+1 234 567 890"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="urls"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Links
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Website, Instagram, X..."
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Separate links with commas or new lines.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Street
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Street address"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              City
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="City"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              State
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="State"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zip_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              ZIP
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ZIP code"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.3em]">
                              Country
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Country"
                                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end border-t border-border/60 pt-6">
                      <Button
                        type="submit"
                        disabled={isPending || !form.formState.isDirty}
                        className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
                      >
                        {isPending ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl font-[var(--font-editorial)]">
                Live preview
              </CardTitle>
              <CardDescription>
                This is how your profile appears to readers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarPreview} alt={displayName} />
                  <AvatarFallback>
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.user.email || user?.email}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                {form.watch("bio")?.trim()
                  ? form.watch("bio")
                  : "Add a short bio to introduce your writing voice."}
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {displayName}
                    {displayUsername ? ` · @${displayUsername}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[
                      form.watch("city"),
                      form.watch("state"),
                      form.watch("country"),
                    ]
                      .map((item) => item?.trim())
                      .filter(Boolean)
                      .join(", ") || "Add a location"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  {linkPreview.length ? (
                    <div className="flex flex-wrap gap-2">
                      {linkPreview.map((link) => (
                        <span
                          key={link}
                          className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs"
                        >
                          {link}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>Add your portfolio links</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
