/** Trip (safety journey) types — mirror the backend TripResource. */

export interface TripPoint {
  label: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Trip {
  id: string;
  organization_id: string;
  user_id: string;
  status: string;
  origin: TripPoint;
  destination: TripPoint;
  started_at: string | null;
  expected_arrival_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface TripFilters {
  status?: string;
  page?: number;
}

/** `POST organizations/{org}/trips` payload (mirrors StartTripRequest). */
export interface CreateTripInput {
  user_id?: string;
  origin_label?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_label?: string;
  destination_lat?: number;
  destination_lng?: number;
  expected_arrival_at?: string;
  notes?: string;
}

/** `PATCH organizations/{org}/trips/{trip}` payload (mirrors UpdateTripRequest). */
export interface UpdateTripInput {
  destination_label?: string;
  destination_lat?: number;
  destination_lng?: number;
  expected_arrival_at?: string;
  notes?: string;
}
