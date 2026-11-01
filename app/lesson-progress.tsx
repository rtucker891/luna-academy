"use client";

import { useEffect, useState } from "react";

type LessonProgressProps = {
  trackSlug: string;
  lessonTitles: string[];
};

export default function LessonProgress({
  trackSlug,
  lessonTitles,
}: LessonProgressProps) {
  const storageKey = `luna-academy:progress:v1:${trackSlug}`;

  const [completed, setCompleted] = useState<string[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setLoadedKey(null);
    setStorageError(false);

    try {
      const saved = window.localStorage.getItem(storageKey);
      const parsed: unknown = saved ? JSON.parse(saved) : [];

      setCompleted(
        Array.isArray(parsed)
          ? parsed.filter((value): value is string => typeof value === "string")
          : [],
      );
    } catch {
      setCompleted([]);
      setStorageError(true);
    }

    setLoadedKey(storageKey);
  }, [storageKey]);

  const ready = loadedKey === storageKey;
  const completedCount = lessonTitles.filter((title) =>
    completed.includes(title),
  ).length;

  const percentage =
    lessonTitles.length > 0
      ? Math.round((completedCount / lessonTitles.length) * 100)
      : 0;

  function saveProgress(next: string[]) {
    setCompleted(next);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  function toggleLesson(title: string) {
    const next = completed.includes(title)
      ? completed.filter((item) => item !== title)
      : [...completed, title];

    saveProgress(next);
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Reset all completion marks for this learning track?",
    );

    if (confirmed) {
      saveProgress([]);
    }
  }

  return (
    <section
      aria-label="Learning track progress"
      style={{
        margin: "24px 0",
        padding: "24px",
        border: "1px solid #cbd5e1",
        borderRadius: "16px",
        background: "#ffffff",
        color: "#0f172a",
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: "1.3rem" }}>
        Your learning progress
      </h2>

      <p aria-live="polite" style={{ margin: "0 0 12px" }}>
        {ready
          ? `${completedCount} of ${lessonTitles.length} lessons complete · ${percentage}%`
          : "Loading saved progress…"}
      </p>

      <progress
        aria-label="Lessons completed"
        value={ready ? completedCount : 0}
        max={Math.max(lessonTitles.length, 1)}
        style={{
          width: "100%",
          height: "16px",
          accentColor: "#0f766e",
        }}
      />

      <p style={{ fontSize: "0.9rem", color: "#475569" }}>
        Completion is self-reported and saved only in this browser.
        It does not certify competence or grant production access.
      </p>

      {storageError && (
        <p role="alert" style={{ color: "#9a3412" }}>
          Browser storage is unavailable or could not be read. Your marks
          may not remain after you refresh or leave this page.
        </p>
      )}

      <ul
        style={{
          listStyle: "none",
          margin: "20px 0",
          padding: 0,
          display: "grid",
          gap: "12px",
        }}
      >
        {lessonTitles.map((title, index) => (
          <li key={title}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                cursor: ready ? "pointer" : "wait",
              }}
            >
              <input
                type="checkbox"
                checked={ready && completed.includes(title)}
                disabled={!ready}
                onChange={() => toggleLesson(title)}
                style={{
                  marginTop: "4px",
                  width: "18px",
                  height: "18px",
                  flexShrink: 0,
                  accentColor: "#0f766e",
                }}
              />

              <span>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: "#64748b",
                  }}
                >
                  Lesson {index + 1}
                </span>
                {title}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={resetProgress}
        disabled={!ready || completedCount === 0}
        style={{
          padding: "10px 16px",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          background: "#f8fafc",
          color: "#0f172a",
          cursor:
            !ready || completedCount === 0 ? "not-allowed" : "pointer",
          opacity: !ready || completedCount === 0 ? 0.5 : 1,
        }}
      >
        Reset track progress
      </button>
    </section>
  );
}