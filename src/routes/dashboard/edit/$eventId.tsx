import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getMyEvent,
  updateEvent,
  getVenueOptions,
  getPerformerOptions,
  type UpdateEventInput,
  type DashboardEvent,
  type VenueOption,
  type PerformerOption,
} from "~/lib/dashboard";

export const Route = createFileRoute("/dashboard/edit/$eventId")({
  component: EditEventPage,
});

const eventTypeOptions = [
  { value: "music", label: "Music" },
  { value: "comedy", label: "Comedy" },
  { value: "festival", label: "Festival" },
  { value: "market", label: "Market" },
  { value: "family", label: "Family" },
  { value: "nightlife", label: "Nightlife" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
  { value: "food", label: "Food" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
  { value: "sold_out", label: "Sold Out" },
];

function toDatetimeLocal(isoStr: string): string {
  const d = new Date(isoStr);
  // Format as YYYY-MM-DDTHH:MM (local time)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditEventPage() {
  const { eventId } = useParams({ from: "/dashboard/edit/$eventId" });
  const navigate = useNavigate();

  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [performers, setPerformers] = useState<PerformerOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("music");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueId, setVenueId] = useState("");
  const [performerId, setPerformerId] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [priceCents, setPriceCents] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("draft");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [event, v, p] = await Promise.all([
        getMyEvent({ data: eventId }),
        getVenueOptions(),
        getPerformerOptions(),
      ]);

      setVenues(v);
      setPerformers(p);

      if (!event) {
        setError("Event not found or you don't have permission to edit it.");
        setLoading(false);
        return;
      }

      setTitle(event.title);
      setDescription(event.description ?? "");
      setEventType(event.eventType);
      setStartTime(toDatetimeLocal(event.startTime));
      setEndTime(event.endTime ? toDatetimeLocal(event.endTime) : "");
      setVenueId(event.venueId ?? "");
      setPerformerId(event.performerId ?? "");
      setCoverImage(event.coverImage ?? "");
      setPriceCents(
        event.priceCents != null ? (event.priceCents / 100).toFixed(2) : "",
      );
      setCapacity(event.capacity != null ? String(event.capacity) : "");
      setStatus(event.status);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load event.";
      setError(message);
      if (message.includes("logged in")) {
        navigate({ to: "/login" });
      }
    } finally {
      setLoading(false);
      setLoadingOptions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const data: UpdateEventInput = {
      title: title.trim(),
      eventType,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      status,
    };

    if (description.trim()) data.description = description.trim();
    else data.description = null;

    if (endTime) data.endTime = new Date(endTime).toISOString();
    else data.endTime = null;

    data.venueId = venueId || null;
    data.performerId = performerId || null;
    data.coverImage = coverImage.trim() || null;
    data.priceCents = priceCents ? Math.round(parseFloat(priceCents) * 100) : null;
    data.capacity = capacity ? parseInt(capacity, 10) : null;

    // Remove undefined values (don't send fields we're not updating)
    Object.keys(data).forEach((key) => {
      if ((data as Record<string, unknown>)[key] === undefined) {
        delete (data as Record<string, unknown>)[key];
      }
    });

    try {
      await updateEvent({ data: { eventId, data } });
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update event.";
      setError(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <a
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-1 text-gray-600">
          Update your event details below.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Event Type */}
        <div className="mb-4">
          <label htmlFor="eventType" className="mb-1 block text-sm font-medium text-gray-700">
            Event Type *
          </label>
          <select
            id="eventType"
            required
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {eventTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div className="mb-4">
          <label htmlFor="startTime" className="mb-1 block text-sm font-medium text-gray-700">
            Start Time *
          </label>
          <input
            id="startTime"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* End Time */}
        <div className="mb-4">
          <label htmlFor="endTime" className="mb-1 block text-sm font-medium text-gray-700">
            End Time
          </label>
          <input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Venue */}
        <div className="mb-4">
          <label htmlFor="venueId" className="mb-1 block text-sm font-medium text-gray-700">
            Venue
          </label>
          <select
            id="venueId"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={loadingOptions}
          >
            <option value="">— Select a venue —</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Performer */}
        <div className="mb-4">
          <label htmlFor="performerId" className="mb-1 block text-sm font-medium text-gray-700">
            Performer
          </label>
          <select
            id="performerId"
            value={performerId}
            onChange={(e) => setPerformerId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={loadingOptions}
          >
            <option value="">— Select a performer —</option>
            {performers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cover Image URL */}
        <div className="mb-4">
          <label htmlFor="coverImage" className="mb-1 block text-sm font-medium text-gray-700">
            Cover Image URL
          </label>
          <input
            id="coverImage"
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Price & Capacity */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priceCents" className="mb-1 block text-sm font-medium text-gray-700">
              Price ($)
            </label>
            <input
              id="priceCents"
              type="number"
              step="0.01"
              min="0"
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 200"
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}
