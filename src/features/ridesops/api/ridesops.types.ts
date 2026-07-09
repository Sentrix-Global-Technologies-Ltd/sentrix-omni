/** Rides-Ops (marketplace admin) types — mirror backend resources (SuperAdmin). */

export interface RidesOverview {
  rides: { active: number; scheduled: number; completed: number; cancelled: number };
  revenue_cents: number;
  cancel_rate: number;
  drivers: { online: number; on_trip: number };
  fleet: { total: number; active: number };
  deliveries_active: number;
  surge: Record<string, unknown> | null;
}

export interface OpsRide {
  id: string;
  user_id: string;
  ride_class: string;
  status: string;
  origin_label: string | null;
  dest_label: string | null;
  distance_km: number | null;
  fare_estimate_cents: number | null;
  final_fare_cents: number | null;
  currency: string | null;
  surge_multiplier: number | null;
  driver_name: string | null;
  driver_plate: string | null;
  cancel_reason: string | null;
  requested_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
}

export interface OpsDriver {
  id: string;
  user_id: string;
  stage: string;
  availability: string;
  fleet_safety_score: number | null;
  trips_count: number | null;
  rating_avg: number | null;
  vehicle: {
    make: string | null;
    model: string | null;
    plate: string | null;
    color: string | null;
  };
  created_at: string | null;
}

export interface RideFilters {
  status?: string;
  page?: number;
}

export interface DriverFilters {
  stage?: string;
  availability?: string;
  page?: number;
}
