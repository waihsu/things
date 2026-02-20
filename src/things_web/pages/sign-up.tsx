"use client";

import { Button } from "@/src/things_web/components/ui/button";
import { Checkbox } from "@/src/things_web/components/ui/checkbox";
import { Input } from "@/src/things_web/components/ui/input";
import { Label } from "@/src/things_web/components/ui/label";
import { motion, useReducedMotion } from "framer-motion";
import { Chrome, Github, Twitter } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "../lib/auth";
import { Link } from "react-router";
import { toast } from "sonner";

const socialProviders = [
  { name: "Google", icon: Chrome },
  { name: "Twitter", icon: Twitter },
  { name: "GitHub", icon: Github },
];

export function SignUpPage() {
  const shouldReduceMotion = useReducedMotion();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      const message = "Please accept the terms to continue.";
      setError(message);
      toast.error(message);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!firstName || !lastName || !email || !password) {
      const message = "Please fill in all required fields.";
      setError(message);
      toast.error(message);
      return;
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        callbackURL: "/",
      });
      toast.success("Account created successfully!");
    } catch (err) {
      const message = "Sign up failed. Please try again.";
      setError(message);
      toast.error(message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: shouldReduceMotion ? "linear" : [0.16, 1, 0.3, 1],
      }}
      className="group w-full rounded-3xl overflow-hidden border border-border/60 bg-card/85 p-8 backdrop-blur-xl sm:p-12 relative"
      aria-labelledby="glass-sign-up-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"
      />
      <div className="mb-8 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-foreground/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Sign Up
        </div>
        <h1
          id="glass-sign-up-title"
          className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl"
        >
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start building expressive interfaces. Choose a provider or sign up
          with email.
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {socialProviders.map((provider) => (
          <Button
            key={provider.name}
            variant="outline"
            className="flex items-center justify-center gap-2 rounded-full border-border/60 bg-card/70 text-sm text-foreground transition-transform duration-300 hover:-translate-y-1 hover:text-brand-strong hover:border-brand/50"
            aria-label={`Continue with ${provider.name}`}
            onClick={() =>
              authClient.signIn.social({
                provider: provider.name.toLowerCase(),
                callbackURL: "/",
              })
            }
          >
            <provider.icon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{provider.name}</span>
          </Button>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border/70" />
        <span className="text-xs uppercase tracking-[0.34em] text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border/70" />
      </div>

      <form className="grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="first-name">First name</Label>
          <Input
            id="first-name"
            name="firstName"
            placeholder="Alex"
            autoComplete="given-name"
            required
            className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            name="lastName"
            placeholder="Johnson"
            autoComplete="family-name"
            required
            className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="sign-up-email">Email address</Label>
          <Input
            id="sign-up-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
            name="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            required
            className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="sign-up-confirm-password">Confirm password</Label>
          <Input
            id="sign-up-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            required
            className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <Checkbox
              id="sign-up-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
            />
            <span>
              I agree to the{" "}
              <button
                type="button"
                className="text-brand-strong underline-offset-4 hover:underline"
              >
                terms of service
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="text-brand-strong underline-offset-4 hover:underline"
              >
                privacy policy
              </button>
              .
            </span>
          </label>
        </div>

        <div className="sm:col-span-2">
          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
          <Button
            type="submit"
            disabled={!acceptedTerms || isSubmitting}
            className="w-full rounded-full bg-brand px-6 py-3 text-brand-ink shadow-[0_20px_60px_-30px_rgba(243,213,149,0.7)] transition-transform duration-300 hover:-translate-y-1 hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          to={"/login"}
          type="button"
          className="text-brand-strong underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
