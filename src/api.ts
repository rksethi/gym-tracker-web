import type { Exercise, WorkoutSession, SessionSummary, WorkoutTemplate } from "./types";

const BASE = "/api";

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  exercises: {
    list: () => request<Exercise[]>("/exercises"),
    create: (name: string, category: string) =>
      request<Exercise>("/exercises", { method: "POST", body: JSON.stringify({ name, category }) }),
  },

  sessions: {
    list: () => request<SessionSummary[]>("/sessions"),
    get: (id: number) => request<WorkoutSession>(`/sessions/${id}`),
    create: (name: string, templateId?: number) =>
      request<WorkoutSession>("/sessions", {
        method: "POST",
        body: JSON.stringify({ name, templateId }),
      }),
    update: (id: number, data: Partial<{ name: string; duration: number; is_completed: boolean }>) =>
      request<WorkoutSession>(`/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ ok: boolean }>(`/sessions/${id}`, { method: "DELETE" }),
  },

  entries: {
    add: (sessionId: number, exerciseIds: number[]) =>
      request<WorkoutSession>(`/sessions/${sessionId}/entries`, {
        method: "POST",
        body: JSON.stringify({ exerciseIds }),
      }),
    update: (entryId: number, data: { max_heart_rate?: number | null }) =>
      request<WorkoutSession>(`/entries/${entryId}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (entryId: number) =>
      request<WorkoutSession>(`/entries/${entryId}`, { method: "DELETE" }),
  },

  sets: {
    add: (entryId: number) =>
      request<WorkoutSession>(`/entries/${entryId}/sets`, { method: "POST" }),
    update: (setId: number, data: Partial<{ reps: number; weight: number; unit: string; is_completed: boolean; intensity: number; intensity_unit: string; duration_minutes: number }>) =>
      request<WorkoutSession>(`/sets/${setId}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (setId: number) =>
      request<WorkoutSession>(`/sets/${setId}`, { method: "DELETE" }),
  },

  templates: {
    list: () => request<WorkoutTemplate[]>("/templates"),
    create: (name: string, exerciseIds: number[]) =>
      request<WorkoutTemplate>("/templates", {
        method: "POST",
        body: JSON.stringify({ name, exerciseIds }),
      }),
    delete: (id: number) => request<{ ok: boolean }>(`/templates/${id}`, { method: "DELETE" }),
  },
};
