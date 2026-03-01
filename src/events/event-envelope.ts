/**
 * Event Envelope — Shared Types for Cross-Repo Events
 *
 * Standardizes the shape of events flowing between:
 *   fn-legacy → fn-flux → fn-forge
 *   fn-v2 → fn-flux
 *
 * Each repo uses slightly different envelope shapes today.
 * This defines the canonical structure going forward.
 */

/** Base envelope fields shared by all event types */
export interface EventEnvelope<TPayload = Record<string, unknown>> {
  /** Schema version for forward compatibility */
  schemaVersion: "v1";
  /** Unique event ID (UUID) */
  eventId: string;
  /** Dot-notation event type, e.g. "order.created", "submission.approved" */
  eventType: string;
  /** Idempotency key for deduplication */
  idempotencyKey: string;
  /** ISO 8601 timestamp of emission */
  emittedAt: string;
  /** User who triggered the event (null for system events) */
  actorUserId: string | null;
  /** Username of the actor */
  actorUsername: string | null;
  /** Event-specific payload */
  payload: TPayload;
}

/**
 * Compass event types emitted by fn-legacy
 *
 * These flow from Compass → Flux via POST to FLUX_LEGACY_EVENT_URL
 */
export type CompassEventType =
  | "order.created"
  | "order.status_changed"
  | "hold.created"
  | "hold.released"
  | "hold.expired"
  | "plan.created"
  | "rate_exception.requested"
  | "rate_exception.approved"
  | "rate_exception.denied";

/**
 * Forge event types emitted by fn-forge
 *
 * These flow from Forge → Flux via POST to /api/integrations/forge-events
 */
export type ForgeEventType =
  | "submission.approved"
  | "submission.rejected"
  | "submission.revision_requested"
  | "submission.escalated";

/**
 * Fulfillment event types emitted by fn-flux
 *
 * These flow from Flux → Forge via outbox pattern
 */
export type FulfillmentEventType = "fulfillment.creative_needed";

/**
 * Compass sync event types emitted by fn-v2
 *
 * These flow from fn-v2 → Flux via POST to /api/compass/events
 */
export type CompassSyncEventType = "order.synced" | "order.amended";

/** All known event types across the ecosystem */
export type FnEventType =
  | CompassEventType
  | ForgeEventType
  | FulfillmentEventType
  | CompassSyncEventType;
