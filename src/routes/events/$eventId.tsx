import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getEvent, getEventReviews } from "~/lib/events";
import type { EventSummary, ReviewSummary } from "~/lib/events";
import { checkReviewAccess, submitReview, type SubmittedReview } from "~/lib/reviews";
import { StarRating } from "~/components/StarRating";

export const Route = createFileRoute("/events/$eventId")({
  component: EventDetailPage,
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

const eventTypeColors: Record<string, string> = {
  music: "bg-purple-100 text-purple-800",
  comedy: "bg-yellow-100 text-yellow-800",
  festival: "bg-pink-100 text-pink-800",
  market: "bg-green-100 text-green-800",
  family: "bg-blue-100 text-blue-800",
  nightlife: "bg-indigo-100 text-indigo-800",
  sports: "bg-orange-100 text-orange-800",
  arts: "bg-red-100 text-red-800",
  food: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

function ReviewCard({ review }: { review: ReviewSummary }) {
  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      <div className="mb-2 flex items-center gap-2">
        <StarRating rating={review.rating} size="sm" />
        <span className="text-sm font-medium text-gray-700">
          {review.rating}/5
        </span>
        {review.isVerified && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Verified
          </span>
        )}
      </div>
      {review.comment && (
        <p className="mb-2 text-sm text-gray-600">{review.comment}</p>
      )}
      <p className="text-xs text-gray-400">
        {review.displayName} •{" "}
        {new Date(review.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

const STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/5kQ9ATeZD3kd0TYdad6Ri00";

function ReviewForm({
  eventId,
  onSubmitted,
}: {
  eventId: string;
  onSubmitted: (review: SubmittedReview) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result = await submitReview({
        data: { eventId, rating, comment: comment || undefined },
      });
      setSuccess(true);
      setRating(0);
      setComment("");
      onSubmitted(result);
    } catch (err: any) {
      setError(err.message ?? "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-700">
          Review submitted! Thank you for sharing your experience.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Your Rating
        </label>
        <StarRating
          rating={rating}
          interactive
          onChange={setRating}
          size="lg"
        />
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-500">{rating} / 5</span>
        )}
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Your Review (optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Share your experience at this event..."
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound_, setNotFound] = useState(false);
  const [access, setAccess] = useState({
    isLoggedIn: false,
    hasSubscription: false,
    canReview: false,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [eventData, reviewsData, accessData] = await Promise.all([
          getEvent({ data: eventId }),
          getEventReviews({ data: eventId }),
          checkReviewAccess(),
        ]);
        if (!eventData) {
          setNotFound(true);
          return;
        }
        setEvent(eventData);
        setReviews(reviewsData);
        setAccess(accessData);
      } catch (err) {
        console.error("Failed to load event:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 rounded-xl bg-gray-200" />
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-1/3 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  if (notFound_ || !event) {
    throw notFound();
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleNewReview = (newReview: SubmittedReview) => {
    // Add the new review to the list and refresh
    setReviews((prev) => [
      {
        id: newReview.id,
        userId: newReview.userId,
        eventId: newReview.eventId,
        rating: newReview.rating,
        comment: newReview.comment,
        isVerified: newReview.isVerified,
        displayName: "You",
        avatarUrl: null,
        createdAt: newReview.createdAt,
      },
      ...prev,
    ]);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to events
      </Link>

      {/* Cover image */}
      <div className="mb-6 overflow-hidden rounded-xl bg-gray-100">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-64 w-full object-cover sm:h-80"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center text-gray-400 sm:h-80">
            <svg
              className="h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Type badge + status */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${eventTypeColors[event.eventType] ?? eventTypeColors.other}`}
        >
          {event.eventType}
        </span>
        {event.status === "sold_out" && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            Sold Out
          </span>
        )}
        {event.status === "cancelled" && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            Cancelled
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
        {event.title}
      </h1>

      {/* Date & time */}
      <div className="mb-1 flex items-center gap-2 text-gray-600">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>
          {formatDate(event.startTime)} at {formatTime(event.startTime)}
          {event.endTime && ` — ${formatTime(event.endTime)}`}
        </span>
      </div>

      {/* Venue */}
      {event.venueName && (
        <div className="mb-1 flex items-center gap-2 text-gray-600">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {event.venueId ? (
            <Link
              to="/venues/$venueId"
              params={{ venueId: event.venueId }}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {event.venueName}
            </Link>
          ) : (
            <span>{event.venueName}</span>
          )}
        </div>
      )}

      {/* Performer */}
      {event.performerName && (
        <div className="mb-1 flex items-center gap-2 text-gray-600">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          {event.performerId ? (
            <Link
              to="/performers/$performerId"
              params={{ performerId: event.performerId }}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {event.performerName}
            </Link>
          ) : (
            <span>{event.performerName}</span>
          )}
        </div>
      )}

      {/* Price */}
      <div className="mb-6">
        <span
          className={`text-xl font-bold ${event.priceCents ? "text-indigo-600" : "text-green-600"}`}
        >
          {formatPrice(event.priceCents)}
        </span>
      </div>

      {/* Description */}
      {event.description && (
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">About</h2>
          <p className="whitespace-pre-line text-gray-600">{event.description}</p>
        </div>
      )}

      {/* Reviews section */}
      <section className="border-t border-gray-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Reviews</h2>

        {reviews.length > 0 ? (
          <>
            {/* Average rating */}
            <div className="mb-6 flex items-center gap-3">
              <StarRating rating={Math.round(avgRating * 2) / 2} size="lg" />
              <span className="text-lg font-semibold text-gray-700">
                {avgRating.toFixed(1)} ★
              </span>
              <span className="text-sm text-gray-500">
                from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            {/* Review list */}
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500">No reviews yet</p>
        )}

        {/* ---- Review Submission Section ---- */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Leave a Review
          </h3>

          {/* State A: Not logged in */}
          {!access.isLoggedIn && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm text-gray-600">
                Log in to leave a review.
              </p>
              <Link
                to="/login"
                className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Log In
              </Link>
            </div>
          )}

          {/* State B: Logged in but no subscription */}
          {access.isLoggedIn && !access.hasSubscription && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <p className="mb-3 text-sm text-gray-700">
                Get a{" "}
                <span className="font-semibold text-indigo-700">Reviewer Pass</span>{" "}
                to leave reviews —{" "}
                <span className="font-semibold">$4.99 lifetime</span>
              </p>
              <a
                href={STRIPE_PAYMENT_LINK}
                className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Get Reviewer Pass →
              </a>
            </div>
          )}

          {/* State C: Logged in with active subscription */}
          {access.canReview && (
            <ReviewForm
              eventId={eventId}
              onSubmitted={handleNewReview}
            />
          )}
        </div>
      </section>
    </main>
  );
}
