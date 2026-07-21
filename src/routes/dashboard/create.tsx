import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  createEvent,
  getVenueOptions,
  getPerformerOptions,
  type CreateEventInput,
  type VenueOption,
  type PerformerOption,
} from "~/lib/dashboard";

export const Route = createFileRoute("/dashboard/create")({
  component: CreateEventPage,
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

function CreateEventPage() {
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

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const [v, p] = await Promise.all([getVenueOptions(), getPerformerOptions()]);
      setVenues(v);
      setPerformers(p);
    } catch {
      // Non-critical — dropdowns will just be empty
    } finally {
      setLoadingOptions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const data: CreateEventInput = {
      title: title.trim(),
      eventType,
      startTime: startTime ? new Date(startTime).toISOString() : "",
    };

    if (description.trim()) data.description = description.trim();
    if (endTime) data.endTime = new Date(endTime).toISOString();
    if (venueId) data.venueId = venueId;
    if (performerId) data.performerId = performerId;
    if (coverImage.trim()) data.coverImage = coverImage.trim();
    if (priceCents) data.priceCents = Math.round(parseFloat(priceCents) * 100);
    if (capacity) data.capacity = parseInt(capacity, 10);

    try {
      await createEvent({ data });
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create event.";
      setError(message);
      setSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
        <p className="mt-1 text-gray-600">
          Fill in the details below. Events start as drafts and can be published later.
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
            placeholder="e.g. Friday Night Jazz at The Blue Note"
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
            placeholder="Tell attendees what to expect..."
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

        {/* Price & Capacity (side by side) */}
        <div className="mb-6 grid grid-cols-2 gap-4">
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

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </form>
    </main>
  );
}
