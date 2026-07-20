import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPerformer } from "~/lib/events";
import type { PerformerDetail, EventSummary } from "~/lib/events";
import { EventCard } from "~/components/EventCard";

export const Route = createFileRoute("/performers/$performerId")({
  component: PerformerDetailPage,
});

const genreColors: Record<string, string> = {
  rock: "bg-red-100 text-red-800",
  pop: "bg-pink-100 text-pink-800",
  jazz: "bg-yellow-100 text-yellow-800",
  blues: "bg-blue-100 text-blue-800",
  country: "bg-amber-100 text-amber-800",
  hiphop: "bg-purple-100 text-purple-800",
  electronic: "bg-cyan-100 text-cyan-800",
  classical: "bg-indigo-100 text-indigo-800",
  folk: "bg-green-100 text-green-800",
  latin: "bg-orange-100 text-orange-800",
  reggae: "bg-lime-100 text-lime-800",
  metal: "bg-gray-700 text-gray-100",
  comedy: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

function PerformerDetailPage() {
  const { performerId } = Route.useParams();
  const [performer, setPerformer] = useState<PerformerDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound_, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getPerformer({ data: performerId });
        if (!result.performer) {
          setNotFound(true);
        } else {
          setPerformer(result.performer);
          setEvents(result.events);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [performerId]);

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

  if (notFound_ || !performer) {
    throw notFound();
  }

  const hasPhotos = performer.photos.length > 0;
  const socialEntries = Object.entries(performer.socialLinks);

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
          {performer.photos.slice(0, 4).map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`${performer.name} photo ${i + 1}`}
              className="h-48 w-full flex-shrink-0 rounded-lg object-cover sm:h-64"
            />
          ))}
        </div>
      )}

      {/* Performer name */}
      <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        {performer.name}
      </h1>

      {/* Genre badge */}
      {performer.genre && (
        <div className="mb-4">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${genreColors[performer.genre.toLowerCase()] ?? genreColors.other}`}
          >
            {performer.genre}
          </span>
        </div>
      )}

      {/* Website */}
      {performer.website && (
        <div className="mb-4 flex items-center gap-2 text-gray-600">
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
            href={performer.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            {performer.website.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}

      {/* Social links */}
      {socialEntries.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {socialEntries.map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Bio */}
      {performer.bio && (
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Bio</h2>
          <p className="whitespace-pre-line text-gray-600">{performer.bio}</p>
        </div>
      )}

      {/* Upcoming performances */}
      <section className="border-t border-gray-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Upcoming Performances
        </h2>
        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No upcoming performances scheduled.
          </p>
        )}
      </section>
    </main>
  );
}
