import Link from "next/link";
import { Star, Users, Calendar } from "lucide-react";

export interface Trip {
  id: string;
  departure_city: string;
  destination_city: string;
  departure_location?: string;
  destination_location?: string;
  departure_date: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  driver_first_name?: string;
  driver_last_name?: string;
  driver_rating_average?: number | null;
  driver_rating_count: number;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_category?: string;
  status?: string;
}

function fmt(v: number) {
  return new Intl.NumberFormat("fr-CM").format(v) + " XAF";
}

export default function TripCard({ trip }: { trip: Trip }) {
  const driverName = [trip.driver_first_name, trip.driver_last_name].filter(Boolean).join(" ") || "Driver";
  const initial = driverName[0]?.toUpperCase() || "?";
  const vehicleLabel = [trip.vehicle_brand, trip.vehicle_model].filter(Boolean).join(" ") || trip.vehicle_category || "";

  // Format date: "2026-07-04" → "4 Jul"
  const dateObj = new Date(trip.departure_date + "T" + trip.departure_time);
  const dateStr = dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const timeStr = trip.departure_time.slice(0, 5); // "08:00"

  return (
    <Link href={`/trips/${trip.id}`} className="card card-pressable trip-card" style={{ display: "block" }}>
      {/* Driver row */}
      <div className="driver-row">
        <div className="avatar" style={{ width: 44, height: 44, fontSize: "1rem", flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: ".9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {driverName}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted mt-1">
            {trip.driver_rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star size={11} fill="var(--gold)" color="var(--gold)" />
                {trip.driver_rating_average?.toFixed(1)}
              </span>
            )}
            {vehicleLabel && <span>{vehicleLabel}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 800, fontSize: "1.1rem", color: "var(--green)" }}>
            {fmt(trip.price_per_seat)}
          </div>
          <div className="text-xs text-muted">/ seat</div>
        </div>
      </div>

      {/* Route */}
      <div className="route-wrap mb-3">
        <div className="route-line">
          <div className="dot-start" />
          <div className="line-mid" />
          <div className="dot-end" />
        </div>
        <div className="route-text">
          <div>
            <div style={{ fontWeight: 700 }}>{trip.departure_city}</div>
            {trip.departure_location && (
              <div className="text-xs text-muted">{trip.departure_location}</div>
            )}
          </div>
          <div style={{ height: 10 }} />
          <div>
            <div style={{ fontWeight: 700 }}>{trip.destination_city}</div>
            {trip.destination_location && (
              <div className="text-xs text-muted">{trip.destination_location}</div>
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-muted">
          <Calendar size={13} /> {dateStr} · {timeStr}
        </span>
        <span className="seats-pill">
          <Users size={11} /> {trip.available_seats} seats left
        </span>
      </div>
    </Link>
  );
}