/**
 * Activity logging utility for tracking user actions in Neon database.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ActivityAction =
  | "search"
  | "upload"
  | "chat"
  | "focus_start"
  | "focus_complete"
  | "focus_pause"
  | "memory_view"
  | "memory_create"
  | "memory_update"
  | "memory_delete"
  | "insight_view"
  | "insight_dismiss"
  | "connection_explore"
  | "page_view"
  | "login"
  | "logout";

interface ActivityDetails {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Log a user activity to the database.
 * This is fire-and-forget - errors are logged but don't affect the UI.
 */
export async function logActivity(
  action: ActivityAction,
  details?: ActivityDetails,
  userId?: string
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/activity/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId || "demo-user",
      },
      body: JSON.stringify({
        action,
        details: details || {},
      }),
    });
  } catch (error) {
    // Silent fail - activity logging shouldn't break the app
    console.debug("Activity log failed:", error);
  }
}

/**
 * Get recent activities for the current user.
 */
export async function getRecentActivities(
  limit: number = 50,
  action?: ActivityAction,
  userId?: string
): Promise<Activity[]> {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (action) params.append("action", action);

    const response = await fetch(`${API_URL}/api/activity/recent?${params}`, {
      headers: {
        "X-User-Id": userId || "demo-user",
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.debug("Failed to fetch activities:", error);
  }
  return [];
}

/**
 * Get activity statistics for the current user.
 */
export async function getActivityStats(
  days: number = 7,
  userId?: string
): Promise<ActivityStats | null> {
  try {
    const response = await fetch(`${API_URL}/api/activity/stats?days=${days}`, {
      headers: {
        "X-User-Id": userId || "demo-user",
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.debug("Failed to fetch activity stats:", error);
  }
  return null;
}

// Types
export interface Activity {
  id: string;
  action: string;
  details: ActivityDetails | null;
  created_at: string;
}

export interface ActivityStats {
  total_activities: number;
  activities_by_action: Record<string, number>;
  daily_activities: Record<string, number>;
  most_active_hour: number;
  streak_days: number;
}

// Focus session helpers
export interface FocusSessionData {
  id: string;
  duration_minutes: number;
  break_duration_minutes: number;
  pomodoros_target: number;
  pomodoros_completed: number;
  state: string;
  memories_reviewed: number;
  memories_created: number;
  started_at: string;
  ended_at?: string;
}

export async function createFocusSession(
  data: {
    duration_minutes?: number;
    break_duration_minutes?: number;
    pomodoros_target?: number;
  },
  userId?: string
): Promise<FocusSessionData | null> {
  try {
    const response = await fetch(`${API_URL}/api/activity/focus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId || "demo-user",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.debug("Failed to create focus session:", error);
  }
  return null;
}

export async function updateFocusSession(
  sessionId: string,
  data: Partial<{
    state: string;
    pomodoros_completed: number;
    memories_reviewed: number;
    memories_created: number;
  }>,
  userId?: string
): Promise<FocusSessionData | null> {
  try {
    const response = await fetch(`${API_URL}/api/activity/focus/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId || "demo-user",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.debug("Failed to update focus session:", error);
  }
  return null;
}

export async function getActiveFocusSessions(
  userId?: string
): Promise<FocusSessionData[]> {
  try {
    const response = await fetch(`${API_URL}/api/activity/focus/active`, {
      headers: {
        "X-User-Id": userId || "demo-user",
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.debug("Failed to fetch active focus sessions:", error);
  }
  return [];
}

// ============== Convenience Helper Functions ==============

/**
 * Log a search activity
 */
export function logSearch(
  query: string,
  mode: string,
  resultCount: number,
  userId?: string
): void {
  logActivity("search", { query, mode, result_count: resultCount }, userId);
}

/**
 * Log a file upload activity
 */
export function logUpload(
  filename: string,
  chunksCreated: number,
  userId?: string
): void {
  logActivity("upload", { filename, chunks_created: chunksCreated }, userId);
}

/**
 * Log a memory action (create, view, update, delete)
 */
export function logMemoryAction(
  action: "view" | "create" | "update" | "delete",
  memoryId: string,
  title?: string,
  userId?: string
): void {
  const activityAction = `memory_${action}` as ActivityAction;
  logActivity(activityAction, { memory_id: memoryId, title }, userId);
}

/**
 * Log a focus session action
 */
export function logFocusSession(
  action: "start" | "complete" | "pause",
  sessionType: string,
  durationMinutes: number,
  topic?: string,
  userId?: string
): void {
  const activityAction = `focus_${action}` as ActivityAction;
  logActivity(
    activityAction,
    {
      session_type: sessionType,
      duration_minutes: durationMinutes,
      topic,
    },
    userId
  );
}

/**
 * Log an insight interaction
 */
export function logInsightViewed(
  insightId: string,
  insightType: string,
  userId?: string
): void {
  logActivity("insight_view", { insight_id: insightId, type: insightType }, userId);
}

/**
 * Log a chat message
 */
export function logChat(
  sessionId: string,
  messageType: "user" | "assistant",
  userId?: string
): void {
  logActivity("chat", { session_id: sessionId, message_type: messageType }, userId);
}
