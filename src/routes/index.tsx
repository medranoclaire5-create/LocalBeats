import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { EventCard, type EventSummary } from "~/components/EventCard";
import { getEvents, type EventFilters } from "~/lib/events";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const EVENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "music", label: "Music" },
  { value: "comedy", label: "Comedy" },
  { value: "festival", label: "Festival" },
  { value: "market", label: "Market" },
  { value: "family", label: "Family" },
  { value: "nightlife", label: "Nightlife" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
  { value: "food", label: "Food" },
];

const PRICE_FILTERS = [
  { value: "all", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

function HomePage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchEvents = async (filters: EventFilters) => {
    setLoading(true);
    try {
      const result = await getEvents({ data: filters });
      setEvents(result);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents({});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents({
      search: search || undefined,
      eventType: eventType !== "all" ? eventType : undefined,
      priceFilter: priceFilter !== "all" ? (priceFilter as "free" | "paid") : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const handleFilterChange = (
    type?: string,
    price?: string,
    from?: string,
    to?: string,
  ) => {
    fetchEvents({
      search: search || undefined,
      eventType: (type ?? eventType) !== "all" ? (type ?? eventType) : undefined,
      priceFilter:
        (price ?? priceFilter) !== "all"
          ? ((price ?? priceFilter) as "free" | "paid")
          : undefined,
      dateFrom: (from ?? dateFrom) || undefined,
      dateTo: (to ?? dateTo) || undefined,
    });
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-4 py-16 text-center text-white sm:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Discover What's Happening in Your Town
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
          Find live music, comedy shows, festivals, markets, and more — all in
          one place.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="mx-auto mt-8 flex max-w-xl gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, venues, performers..."
            className="flex-1 rounded-lg border-0 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="submit"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            Search
          </button>
        </form>
      </section>

      {/* Filters + Events */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                handleFilterChange(e.target.value, undefined, undefined, undefined);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Price
            </label>
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value);
                handleFilterChange(undefined, e.target.value, undefined, undefined);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {PRICE_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                handleFilterChange(undefined, undefined, e.target.value, undefined);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                handleFilterChange(undefined, undefined, undefined, e.target.value);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {(eventType !== "all" ||
            priceFilter !== "all" ||
            dateFrom ||
            dateTo ||
            search) && (
            <button
              onClick={() => {
                setSearch("");
                setEventType("all");
                setPriceFilter("all");
                setDateFrom("");
                setDateTo("");
                fetchEvents({});
              }}
              className="rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Event grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white"
              >
                <div className="h-48 rounded-t-xl bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No events found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later for upcoming events.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
