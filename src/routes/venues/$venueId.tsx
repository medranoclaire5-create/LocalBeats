import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getVenue } from "~/lib/events";
import type { VenueDetail, EventSummary } from "~/lib/events";
import { EventCard } from "~/components/EventCard";

export const Route = createFileRoute("/venues/$venueId")({
  component: VenueDetailPage,
});

function VenueDetailPage() {
  const { venueId } = Route.useParams();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound_, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getVenue({ data: venueId });
        if (!result.venue) {
          setNotFound(true);
        } else {
          setVenue(result.venue);
          setEvents(result.events);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [venueId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-24 rounded bg-gray-200" />
          <div className="h-64 rounded-xl bg-gray-200" />
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-1/3 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  if (notFound_ || !venue) {
    throw notFound();
  }

  const hasPhotos = venue.photos.length > 0;

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
        Back
      </Link>

      {/* Photo gallery */}
      {hasPhotos && (
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl">
          {venue.photos.slice(0, 4).map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`${venue.name} photo ${i + 1}`}
              className="h-48 w-full flex-shrink-0 rounded-lg object-cover sm:h-64"
            />
          ))}
        </div>
      )}

      {/* Venue name */}
      <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        {venue.name}
      </h1>

      {/* Address */}
      {venue.address && (
        <div className="mb-2 flex items-start gap-2 text-gray-600">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0"
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
          <span>
            {venue.address}
            {venue.city && `, ${venue.city}`}
            {venue.state && `, ${venue.state}`}
            {venue.zip && ` ${venue.zip}`}
          </span>
        </div>
      )}

      {/* Phone */}
      {venue.phone && (
        <div className="mb-2 flex items-center gap-2 text-gray-600">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <a
            href={`tel:${venue.phone}`}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {venue.phone}
          </a>
        </div>
      )}

      {/* Website */}
      {venue.website && (
        <div className="mb-6 flex items-center gap-2 text-gray-600">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <a
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            {venue.website.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}

      {/* Description */}
      {venue.description && (
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            About this Venue
          </h2>
          <p className="whitespace-pre-line text-gray-600">
            {venue.description}
          </p>
        </div>
      )}

      {/* Upcoming events */}
      <section className="border-t border-gray-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Upcoming Events
        </h2>
        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming events at this venue.</p>
        )}
      </section>
    </main>
  );
}
