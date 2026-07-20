import { Link } from "@tanstack/react-router";

export interface EventSummary {
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
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Type badge */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${eventTypeColors[event.eventType] ?? eventTypeColors.other}`}
        >
          {event.eventType}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 line-clamp-1">
          {event.title}
        </h3>

        {/* Date & time */}
        <div className="mb-1 flex items-center gap-1 text-sm text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {formatDate(event.startTime)} • {formatTime(event.startTime)}
          </span>
        </div>

        {/* Venue */}
        {event.venueName && (
          <div className="mb-2 flex items-center gap-1 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span className="line-clamp-1">{event.venueName}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-semibold ${event.priceCents ? "text-indigo-600" : "text-green-600"}`}
          >
            {formatPrice(event.priceCents)}
          </span>
          {event.status === "sold_out" && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
