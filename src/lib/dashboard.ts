/**
 * Server functions for the event management dashboard.
 * All DB queries and auth checks stay on the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { getUserFromCookieHeader } from "./auth";
import { sqlQuery, sql } from "~/db";

// ---- Types ----

export interface DashboardEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startTime: string;
  endTime: string | null;
  venueId: string | null;
  venueName: string | null;
  performerId: string | null;
  performerName: string | null;
  coverImage: string | null;
  priceCents: number | null;
  capacity: number | null;
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  venueId?: string;
  performerId?: string;
  coverImage?: string;
  priceCents?: number;
  capacity?: number;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  venueId?: string;
  performerId?: string;
  coverImage?: string;
  priceCents?: number;
  capacity?: number;
  status?: string;
}

export interface VenueOption {
  id: string;
  name: string;
}

export interface PerformerOption {
  id: string;
  name: string;
}

// ---- Helpers ----

async function requireAuth(): Promise<{
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}> {
  const request = getRequest();
  const cookieHeader = request.headers.get("cookie");
  const user = await getUserFromCookieHeader(cookieHeader);

  if (!user) {
    throw new Error("You must be logged in to access the dashboard.");
  }

  return user;
}

function coerceDashboardEvent(row: Record<string, unknown>): DashboardEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    eventType: String(row.event_type),
    startTime: String(row.start_time),
    endTime: row.end_time ? String(row.end_time) : null,
    venueId: row.venue_id ? String(row.venue_id) : null,
    venueName: row.venue_name ? String(row.venue_name) : null,
    performerId: row.performer_id ? String(row.performer_id) : null,
    performerName: row.performer_name ? String(row.performer_name) : null,
    coverImage: row.cover_image ? String(row.cover_image) : null,
    priceCents: row.price_cents != null ? Number(row.price_cents) : null,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    status: String(row.status),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  };
}

// ---- Server Functions ----

/**
 * Get all events created by the current user.
 */
export const getMyEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardEvent[]> => {
    const user = await requireAuth();

    const queryStr = `
      SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_time,
        e.end_time,
        e.venue_id,
        v.name AS venue_name,
        e.performer_id,
        p.name AS performer_name,
        e.cover_image,
        e.price_cents,
        e.capacity,
        e.status,
        e.created_by,
        e.created_at
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN performers p ON e.performer_id = p.id
      WHERE e.created_by = $1
      ORDER BY e.created_at DESC
      LIMIT 100
    `;

    const rows = await sqlQuery(queryStr, [user.id]);
    return rows.map(coerceDashboardEvent);
  },
);

/**
 * Get a single event by ID (only if created by current user).
 */
export const getMyEvent = createServerFn({ method: "GET" })
  .validator((eventId: string) => eventId)
  .handler(async ({ data: eventId }): Promise<DashboardEvent | null> => {
    const user = await requireAuth();

    const queryStr = `
      SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_time,
        e.end_time,
        e.venue_id,
        v.name AS venue_name,
        e.performer_id,
        p.name AS performer_name,
        e.cover_image,
        e.price_cents,
        e.capacity,
        e.status,
        e.created_by,
        e.created_at
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN performers p ON e.performer_id = p.id
      WHERE e.id = $1 AND e.created_by = $2
      LIMIT 1
    `;

    const rows = await sqlQuery(queryStr, [eventId, user.id]);

    if (rows.length === 0) return null;

    return coerceDashboardEvent(rows[0]);
  },
);

/**
 * Create a new event. Status defaults to 'draft'.
 */
export const createEvent = createServerFn({ method: "POST" })
  .validator((input: CreateEventInput) => input)
  .handler(async ({ data }): Promise<DashboardEvent> => {
    const user = await requireAuth();

    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      venueId,
      performerId,
      coverImage,
      priceCents,
      capacity,
    } = data;

    if (!title || !title.trim()) {
      throw new Error("Title is required.");
    }

    const validTypes = [
      "music", "comedy", "festival", "market", "family",
      "nightlife", "sports", "arts", "food", "other",
    ];
    if (!validTypes.includes(eventType)) {
      throw new Error(`Invalid event type. Must be one of: ${validTypes.join(", ")}`);
    }

    const rows = await sql`
      INSERT INTO events (
        title, description, event_type, start_time, end_time,
        venue_id, performer_id, cover_image, price_cents,
        capacity, status, created_by
      ) VALUES (
        ${title.trim()},
        ${description?.trim() || null},
        ${eventType},
        ${startTime},
        ${endTime || null},
        ${venueId || null},
        ${performerId || null},
        ${coverImage?.trim() || null},
        ${priceCents != null ? priceCents : null},
        ${capacity != null ? capacity : null},
        'draft',
        ${user.id}
      )
      RETURNING id, created_at
    `;

    return {
      id: String(rows[0].id),
      title: title.trim(),
      description: description?.trim() || null,
      eventType,
      startTime,
      endTime: endTime || null,
      venueId: venueId || null,
      venueName: null,
      performerId: performerId || null,
      performerName: null,
      coverImage: coverImage?.trim() || null,
      priceCents: priceCents != null ? priceCents : null,
      capacity: capacity != null ? capacity : null,
      status: "draft",
      createdBy: user.id,
      createdAt: String(rows[0].created_at),
    };
  },
);

/**
 * Update an existing event (only if created_by = current user).
 */
export const updateEvent = createServerFn({ method: "POST" })
  .validator((input: { eventId: string; data: UpdateEventInput }) => input)
  .handler(async ({ data: { eventId, data } }): Promise<DashboardEvent> => {
    const user = await requireAuth();

    // Verify ownership
    const existing = await sqlQuery(
      "SELECT id, created_by FROM events WHERE id = $1 LIMIT 1",
      [eventId],
    );

    if (existing.length === 0) {
      throw new Error("Event not found.");
    }

    if (String(existing[0].created_by) !== user.id) {
      throw new Error("You do not have permission to edit this event.");
    }

    // Build dynamic SET clause
    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) {
      params.push(data.title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description?.trim() || null);
      updates.push(`description = $${params.length}`);
    }
    if (data.eventType !== undefined) {
      const validTypes = [
        "music", "comedy", "festival", "market", "family",
        "nightlife", "sports", "arts", "food", "other",
      ];
      if (!validTypes.includes(data.eventType)) {
        throw new Error(`Invalid event type. Must be one of: ${validTypes.join(", ")}`);
      }
      params.push(data.eventType);
      updates.push(`event_type = $${params.length}`);
    }
    if (data.startTime !== undefined) {
      params.push(data.startTime);
      updates.push(`start_time = $${params.length}`);
    }
    if (data.endTime !== undefined) {
      params.push(data.endTime || null);
      updates.push(`end_time = $${params.length}`);
    }
    if (data.venueId !== undefined) {
      params.push(data.venueId || null);
      updates.push(`venue_id = $${params.length}`);
    }
    if (data.performerId !== undefined) {
      params.push(data.performerId || null);
      updates.push(`performer_id = $${params.length}`);
    }
    if (data.coverImage !== undefined) {
      params.push(data.coverImage?.trim() || null);
      updates.push(`cover_image = $${params.length}`);
    }
    if (data.priceCents !== undefined) {
      params.push(data.priceCents != null ? data.priceCents : null);
      updates.push(`price_cents = $${params.length}`);
    }
    if (data.capacity !== undefined) {
      params.push(data.capacity != null ? data.capacity : null);
      updates.push(`capacity = $${params.length}`);
    }
    if (data.status !== undefined) {
      const validStatuses = ["draft", "published", "cancelled", "sold_out"];
      if (!validStatuses.includes(data.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      }
      params.push(data.status);
      updates.push(`status = $${params.length}`);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update.");
    }

    updates.push("updated_at = now()");
    params.push(eventId);

    const queryStr = `
      UPDATE events
      SET ${updates.join(", ")}
      WHERE id = $${params.length} AND created_by = $${params.length + 1}
      RETURNING *
    `;
    params.push(user.id);

    const rows = await sqlQuery(queryStr, params);

    if (rows.length === 0) {
      throw new Error("Event not found or permission denied.");
    }

    // Re-fetch with joins for venue/performer names
    const refetchQuery = `
      SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_time,
        e.end_time,
        e.venue_id,
        v.name AS venue_name,
        e.performer_id,
        p.name AS performer_name,
        e.cover_image,
        e.price_cents,
        e.capacity,
        e.status,
        e.created_by,
        e.created_at
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN performers p ON e.performer_id = p.id
      WHERE e.id = $1 AND e.created_by = $2
      LIMIT 1
    `;

    const refetched = await sqlQuery(refetchQuery, [eventId, user.id]);

    if (refetched.length === 0) {
      throw new Error("Event not found after update.");
    }

    return coerceDashboardEvent(refetched[0]);
  },
);

/**
 * Delete an event (only if created_by = current user).
 */
export const deleteEvent = createServerFn({ method: "POST" })
  .validator((eventId: string) => eventId)
  .handler(async ({ data: eventId }): Promise<{ success: boolean }> => {
    const user = await requireAuth();

    const result = await sqlQuery(
      "DELETE FROM events WHERE id = $1 AND created_by = $2",
      [eventId, user.id],
    );

    // sqlQuery doesn't give us rowCount easily with neon, so we check by querying
    const check = await sqlQuery(
      "SELECT id FROM events WHERE id = $1 LIMIT 1",
      [eventId],
    );

    return { success: check.length === 0 };
  },
);

/**
 * Get all venues (for dropdown in create/edit form).
 */
export const getVenueOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<VenueOption[]> => {
    const rows = await sqlQuery(
      "SELECT id, name FROM venues ORDER BY name ASC LIMIT 200",
    );
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
    }));
  },
);

/**
 * Get all performers (for dropdown in create/edit form).
 */
export const getPerformerOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<PerformerOption[]> => {
    const rows = await sqlQuery(
      "SELECT id, name FROM performers ORDER BY name ASC LIMIT 200",
    );
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
    }));
  },
);
