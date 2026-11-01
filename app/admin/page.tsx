"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAcademyAuth } from "../academy-auth";
import { academySupabase } from "../academy-supabase";

type MemberRow = {
  user_id: string;
  display_name: string;
  email: string | null;
  approved: boolean;
  is_director: boolean;
  created_at: string;
};

type CompletionRow = {
  user_id: string;
  track: string;
  lesson: string;
  completed_at: string;
};

const trackNames: Record<string, string> = {
  director: "Director",
  bookkeeper: "Bookkeeper",
  salesman: "Salesman",
  "regulatory-specialist": "Regulatory Specialist",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function TrainingRecordsPage() {
  const auth = useAcademyAuth();
  const supabase = academySupabase();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!supabase) return null;
    const [m, c] = await Promise.all([
      supabase
        .from("academy_members")
        .select("user_id, display_name, email, approved, is_director, created_at")
        .order("created_at"),
      supabase
        .from("lesson_completions")
        .select("user_id, track, lesson, completed_at")
        .order("completed_at", { ascending: false }),
    ]);
    return {
      members: (m.data as MemberRow[]) ?? [],
      completions: (c.data as CompletionRow[]) ?? [],
      failed: Boolean(m.error || c.error),
    };
  }, [supabase]);

  const applyRecords = useCallback((result: Awaited<ReturnType<typeof fetchRecords>>) => {
    if (!result) return;
    setMembers(result.members);
    setCompletions(result.completions);
    setError(result.failed ? "Training records could not be loaded. Please refresh." : "");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!auth?.member.is_director) return;
    let active = true;
    fetchRecords().then((result) => {
      if (active) applyRecords(result);
    });
    return () => {
      active = false;
    };
  }, [auth, fetchRecords, applyRecords]);

  async function load() {
    applyRecords(await fetchRecords());
  }

  async function update(userId: string, change: Partial<Pick<MemberRow, "approved" | "is_director">>) {
    if (!supabase) return;
    const { error: saveError } = await supabase.from("academy_members").update(change).eq("user_id", userId);
    if (saveError) setError("That change could not be saved. Please try again.");
    await load();
  }

  if (!auth?.member.is_director) {
    return (
      <main className="academy-admin">
        <p>Only an Academy Director can view training records.</p>
        <Link href="/">← Back to Luna Academy</Link>
      </main>
    );
  }

  const pending = members.filter((m) => !m.approved);
  const approved = members.filter((m) => m.approved);
  const nameOf = (id: string) => members.find((m) => m.user_id === id)?.display_name ?? "Unknown";

  return (
    <main className="academy-admin">
      <Link href="/">← Back to Luna Academy</Link>
      <h1>Training records</h1>
      {error && <p role="alert" style={{ color: "#9a3412" }}>{error}</p>}
      {loading && <p role="status">Loading…</p>}

      <h2>Waiting for approval ({pending.length})</h2>
      {pending.length === 0 ? (
        <p>No accounts are waiting for approval.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Signed up</th><th /></tr>
          </thead>
          <tbody>
            {pending.map((m) => (
              <tr key={m.user_id}>
                <td>{m.display_name}</td>
                <td>{m.email}</td>
                <td>{formatDate(m.created_at)}</td>
                <td><button type="button" onClick={() => update(m.user_id, { approved: true })}>Approve</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Employees ({approved.length})</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Lessons completed</th><th>Role</th></tr>
        </thead>
        <tbody>
          {approved.map((m) => (
            <tr key={m.user_id}>
              <td>{m.display_name}</td>
              <td>{m.email}</td>
              <td>{completions.filter((c) => c.user_id === m.user_id).length}</td>
              <td>{m.is_director ? "Director" : "Employee"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Completed lessons</h2>
      {completions.length === 0 ? (
        <p>No lessons have been completed yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Employee</th><th>Track</th><th>Lesson</th><th>Completed</th></tr>
          </thead>
          <tbody>
            {completions.map((c) => (
              <tr key={`${c.user_id}-${c.track}-${c.lesson}`}>
                <td>{nameOf(c.user_id)}</td>
                <td>{trackNames[c.track] ?? c.track}</td>
                <td>{c.lesson}</td>
                <td>{formatDate(c.completed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
