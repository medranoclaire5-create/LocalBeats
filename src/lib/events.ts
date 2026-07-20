/**
 * Server functions for fetching events and reviews.
 * All DB queries stay on the server — never exposed to the client.
 */
import { createServerFn } from "@tanstack/react-start";
import { sqlQuery } from "~/db";
import type { EventSummary } from "~/components/EventCard";

export interface ReviewSummary {
  id: string;
  userId: string;
  eventId: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface EventFilters {
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  priceFilter?: "all" | "free" | "paid";
  search?: string;
}

export const getEvents = createServerFn({ method: "GET" })
  .validator((filters: EventFilters) => filters)
  .handler(async ({ data: filters }): Promise<EventSummary[]> => {
    const conditions: string[] = ["e.status = 'published'"];
    const params: unknown[] = [];

    if (filters.eventType && filters.eventType !== "all") {
      params.push(filters.eventType);
      conditions.push(`e.event_type = $${params.length}`);
    }

    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`e.start_time >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`e.start_time <= $${params.length}`);
    }

    if (filters.priceFilter === "free") {
      conditions.push("(e.price_cents IS NULL OR e.price_cents = 0)");
    } else if (filters.priceFilter === "paid") {
      conditions.push("e.price_cents > 0");
    }

    if (filters.search && filters.search.trim()) {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(
        `(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
        e.status
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN performers p ON e.performer_id = p.id
      ${whereClause}
      ORDER BY e.start_time ASC
      LIMIT 50
    `;

    const rows =
      params.length > 0
        ? await sqlQuery(queryStr, params)
        : await sqlQuery(queryStr);

    // Coerce non-primitive types before returning to client
    return rows.map(
      (row): EventSummary => ({
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
      }),
    );
  });

export const getEvent = createServerFn({ method: "GET" })
  .validator((eventId: string) => eventId)
  .handler(async ({ data: eventId }): Promise<EventSummary | null> => {
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
        e.status
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN performers p ON e.performer_id = p.id
      WHERE e.id = $1
      LIMIT 1
    `;

    const rows = await sqlQuery(queryStr, [eventId]);

    if (rows.length === 0) return null;

    const row = rows[0];
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
    };
  });

export const getEventReviews = createServerFn({ method: "GET" })
  .validator((eventId: string) => eventId)
  .handler(async ({ data: eventId }): Promise<ReviewSummary[]> => {
    const queryStr = `
      SELECT
        r.id,
        r.user_id,
        r.event_id,
        r.rating,
        r.comment,
        r.is_verified,
        r.created_at,
        u.display_name,
        u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC
      LIMIT 100
    `;

    const rows = await sqlQuery(queryStr, [eventId]);

    return rows.map(
      (row): ReviewSummary => ({
        id: String(row.id),
        userId: String(row.user_id),
        eventId: String(row.event_id),
        rating: Number(row.rating),
        comment: row.comment ? String(row.comment) : null,
        isVerified: Boolean(row.is_verified),
        displayName: String(row.display_name),
        avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
        createdAt: String(row.created_at),
      }),
    );
  });
