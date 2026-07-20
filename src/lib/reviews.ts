/**
 * Server functions for review submission and access control.
 * All DB queries and auth checks stay on the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { getUserFromCookieHeader } from "./auth";
import { sqlQuery, sql } from "~/db";

// ---- Types ----

export interface ReviewAccessResult {
  canReview: boolean;
  hasSubscription: boolean;
  isLoggedIn: boolean;
}

export interface ReviewInput {
  eventId: string;
  rating: number;
  comment?: string;
}

export interface SubmittedReview {
  id: string;
  userId: string;
  eventId: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
}

// ---- Helpers ----

async function getUserFromRequest(): Promise<{
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
} | null> {
  const request = getRequest();
  const cookieHeader = request.headers.get("cookie");
  return getUserFromCookieHeader(cookieHeader);
}

/**
 * Check if a user has an active subscription.
 */
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const rows = await sqlQuery(
    "SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1",
    [userId],
  );
  return rows.length > 0;
}

// ---- Server Functions ----

/**
 * Check whether the current user can review.
 * Returns { canReview, hasSubscription, isLoggedIn }.
 */
export const checkReviewAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReviewAccessResult> => {
    const user = await getUserFromRequest();

    if (!user) {
      return { canReview: false, hasSubscription: false, isLoggedIn: false };
    }

    const subscribed = await hasActiveSubscription(user.id);
    return {
      canReview: subscribed,
      hasSubscription: subscribed,
      isLoggedIn: true,
    };
  },
);

/**
 * Submit a review for an event.
 * Requires authentication AND active subscription.
 */
export const submitReview = createServerFn({ method: "POST" })
  .validator((input: ReviewInput) => input)
  .handler(async ({ data }): Promise<SubmittedReview> => {
    const user = await getUserFromRequest();

    if (!user) {
      throw new Error("You must be logged in to submit a review.");
    }

    // Check subscription
    const subscribed = await hasActiveSubscription(user.id);
    if (!subscribed) {
      throw new Error(
        "You need a Reviewer Pass to submit reviews. Get one for $4.99.",
      );
    }

    const { eventId, rating, comment } = data;

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    // Validate event exists
    const eventRows = await sqlQuery(
      "SELECT id FROM events WHERE id = $1 LIMIT 1",
      [eventId],
    );
    if (eventRows.length === 0) {
      throw new Error("Event not found.");
    }

    // Insert review
    const rows = await sql`
      INSERT INTO reviews (user_id, event_id, rating, comment, is_verified)
      VALUES (${user.id}, ${eventId}, ${rating}, ${comment ?? null}, ${true})
      RETURNING id, user_id, event_id, rating, comment, is_verified, created_at
    `;

    const row = rows[0] as {
      id: string;
      user_id: string;
      event_id: string;
      rating: number;
      comment: string | null;
      is_verified: boolean;
      created_at: Date;
    };

    return {
      id: String(row.id),
      userId: String(row.user_id),
      eventId: String(row.event_id),
      rating: Number(row.rating),
      comment: row.comment ? String(row.comment) : null,
      isVerified: Boolean(row.is_verified),
      createdAt: String(row.created_at),
    };
  });

/**
 * Activate reviewer access after successful Stripe payment.
 * Inserts a subscription record for the current user.
 * Called from the /reviewer-pass/success page.
 */
export const activateReviewAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ success: boolean; message: string }> => {
    const user = await getUserFromRequest();

    if (!user) {
      throw new Error("You must be logged in to activate your Reviewer Pass.");
    }

    // Check if user already has an active subscription
    const alreadyActive = await hasActiveSubscription(user.id);
    if (alreadyActive) {
      return {
        success: true,
        message: "Your Reviewer Pass is already active!",
      };
    }

    // Insert subscription with placeholder Stripe ID
    const placeholderId = `payment_link_${Date.now()}`;
    await sql`
      INSERT INTO subscriptions (user_id, stripe_subscription_id, status, created_at)
      VALUES (${user.id}, ${placeholderId}, 'active', now())
    `;

    return {
      success: true,
      message:
        "Reviewer Pass activated! You can now leave reviews on any event.",
    };
  },
);
