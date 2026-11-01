"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { academySupabase } from "./academy-supabase";

type Member = {
  user_id: string;
  display_name: string;
  email: string | null;
  approved: boolean;
  is_director: boolean;
};

type AcademyAuth = {
  member: Member;
  recordCompletion: (track: string, lesson: string) => Promise<string | null>;
};

const AuthContext = createContext<AcademyAuth | null>(null);

export function useAcademyAuth() {
  return useContext(AuthContext);
}

export default function AcademyAuthGate({ children }: { children: ReactNode }) {
  const supabase = academySupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    async function apply(next: Session | null) {
      if (!supabase) return;
      if (next) {
        const { data, error: loadError } = await supabase
          .from("academy_members")
          .select("user_id, display_name, email, approved, is_director")
          .eq("user_id", next.user.id)
          .maybeSingle();
        if (!active) return;
        if (loadError) setError("Academy could not check your account. Please try again.");
        setMember((data as Member | null) ?? null);
        setLoadedFor(next.user.id);
      } else {
        if (!active) return;
        setMember(null);
        setLoadedFor(null);
      }
      setSession(next);
      setSessionChecked(true);
    }

    supabase.auth.getSession().then(({ data }) => void apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Run outside Supabase's callback to avoid blocking its auth lock.
      window.setTimeout(() => void apply(next), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const checking = !sessionChecked || (session !== null && loadedFor !== session.user.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        setPassword("");
        setMode("signin");
        setNotice(
          "Account created. Check your email and click the confirmation link, then sign in here. A Director must approve your account before you can start training.",
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw new Error("Sign-in failed. Check your email and Academy password.");
        setPassword("");
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setMember(null);
  }

  async function recordCompletion(track: string, lesson: string) {
    if (!supabase || !member) return "You are not signed in.";
    const { error: saveError } = await supabase
      .from("lesson_completions")
      .upsert(
        { user_id: member.user_id, track, lesson },
        { onConflict: "user_id,track,lesson", ignoreDuplicates: true },
      );
    return saveError ? "Your completion could not be saved. Please try again." : null;
  }

  const card = (content: ReactNode) => (
    <main className="academy-shell">
      <div className="training-banner">TRAINING ONLY · No connection to production Luna</div>
      <section className="academy-auth-card">
        <span className="brand-icon" aria-hidden="true">L</span>
        <h1>Luna Academy</h1>
        {content}
      </section>
    </main>
  );

  if (!supabase) {
    return card(
      <p role="alert">
        Academy sign-in is not configured. Add the Academy Supabase settings to <code>.env.local</code> and restart the
        app.
      </p>,
    );
  }

  if (checking) return card(<p role="status">Checking your Academy account…</p>);

  if (session && member?.approved) {
    return (
      <AuthContext.Provider value={{ member, recordCompletion }}>
        <div className="academy-account-bar">
          <span>
            Signed in to Academy as <strong>{member.display_name}</strong>
            {member.is_director ? " · Director" : ""}
          </span>
          <span className="academy-account-actions">
            {member.is_director && <a href="/admin">Training records</a>}
            <button type="button" onClick={signOut}>Sign out</button>
          </span>
        </div>
        {children}
      </AuthContext.Provider>
    );
  }

  if (session) {
    return card(
      <>
        <p>
          Hello{member ? `, ${member.display_name}` : ""}. Your Academy account is waiting for a Director to approve it.
        </p>
        <p>You’ll be able to start training as soon as it’s approved.</p>
        {error && <p className="academy-auth-error" role="alert">{error}</p>}
        <button type="button" className="academy-auth-secondary" onClick={signOut}>Sign out</button>
      </>,
    );
  }

  return card(
    <>
      <p>{mode === "signin" ? "Sign in with your Academy account." : "Create your Academy account."}</p>
      <p className="academy-auth-warning">
        Use a password that is different from your Luna Accounting password.
      </p>
      <form className="academy-auth-form" onSubmit={submit} aria-busy={busy}>
        {mode === "signup" && (
          <>
            <label htmlFor="academy-name">Full name</label>
            <input
              id="academy-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={120}
              disabled={busy}
            />
          </>
        )}
        <label htmlFor="academy-email">Email address</label>
        <input
          id="academy-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <label htmlFor="academy-password">Academy password</label>
        <input
          id="academy-password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "signup" ? 10 : undefined}
          disabled={busy}
        />
        {mode === "signup" && <small>At least 10 characters.</small>}
        {error && <p className="academy-auth-error" role="alert">{error}</p>}
        {notice && <p className="academy-auth-notice" role="status">{notice}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button
        type="button"
        className="academy-auth-secondary"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
          setNotice("");
        }}
      >
        {mode === "signin" ? "New employee? Create an Academy account" : "Already have an account? Sign in"}
      </button>
    </>,
  );
}
