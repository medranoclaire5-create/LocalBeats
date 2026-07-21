import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getMyEvents,
  deleteEvent,
  type DashboardEvent,
} from "~/lib/dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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

const statusBadgeColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  sold_out: "bg-purple-100 text-purple-800",
};

const eventTypeLabels: Record<string, string> = {
  music: "Music",
  comedy: "Comedy",
  festival: "Festival",
  market: "Market",
  family: "Family",
  nightlife: "Nightlife",
  sports: "Sports",
  arts: "Arts",
  food: "Food",
  other: "Other",
};

function DashboardPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");
    try {
      const result = await getMyEvents();
      setEvents(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load events.";
      setError(message);
      // If not authenticated, redirect to login
      if (message.includes("logged in")) {
        navigate({ to: "/login" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return;
    }

    setDeleting(eventId);
    try {
      const result = await deleteEvent({ data: eventId });
      if (result.success) {
        setEvents(events.filter((e) => e.id !== eventId));
      } else {
        setError("Failed to delete event. It may have already been removed.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete event.";
      setError(message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="mt-1 text-gray-600">
            Create and manage your events from one place.
          </p>
        </div>
        <a
          href="/dashboard/create"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Create Event
        </a>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-400"
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
          <h2 className="mb-2 text-xl font-semibold text-gray-700">
            You haven't created any events yet
          </h2>
          <p className="mb-6 text-gray-500">
            Get started by creating your first event.
          </p>
          <a
            href="/dashboard/create"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Create Event
          </a>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {event.title}
                    </div>
                    {event.venueName && (
                      <div className="text-xs text-gray-500">
                        {event.venueName}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    <div>{formatDate(event.startTime)}</div>
                    <div className="text-xs text-gray-400">
                      {formatTime(event.startTime)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">
                      {eventTypeLabels[event.eventType] ?? event.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeColors[event.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {event.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/dashboard/edit/${event.id}`}
                        className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Edit
                      </a>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {deleting === event.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
