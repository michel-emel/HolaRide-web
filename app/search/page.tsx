"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, MapPin, SlidersHorizontal, ChevronDown } from "lucide-react";
import TripCard, { Trip } from "../components/TripCard";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://hola-ride-api-v2.vercel.app";

// ── Autocomplete component ────────────────────────────────────────────────
interface LocationOption { city: string; location: string; label: string; }

function LocationAutocomplete({
  placeholder, value, options, onChange, onClear, dotColor = "var(--green)", disabled = false
}: {
  placeholder: string;
  value: LocationOption | null;
  options: LocationOption[];
  onChange: (opt: LocationOption | null) => void;
  onClear?: () => void;
  dotColor?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync display text with selected value
  const displayText = open ? query : (value ? value.label : "");

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    o.city.toLowerCase().includes(query.toLowerCase()) ||
    o.location.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(opt: LocationOption) {
    onChange(opt);
    setQuery("");
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    onClear?.();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => { if (!disabled) { setOpen(true); setQuery(""); } }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          border: `1.5px solid ${open ? "var(--green)" : "var(--border)"}`,
          borderRadius: "var(--r)", padding: "10px 12px",
          background: disabled ? "var(--cream)" : "var(--white)",
          cursor: disabled ? "not-allowed" : "text",
          transition: ".15s", boxShadow: open ? "0 0 0 3px rgba(27,107,69,.1)" : "none",
          minHeight: 46,
        }}
      >
        {/* Dot indicator */}
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />

        {/* Input or display */}
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1, border: "none", outline: "none", fontSize: ".9rem",
              background: "transparent", color: "var(--dark)", minWidth: 0 }}
          />
        ) : (
          <div style={{ flex: 1, fontSize: ".9rem", color: value ? "var(--dark)" : "var(--muted)", minWidth: 0 }}>
            {value ? (
              <span>
                <span style={{ fontWeight: 700 }}>{value.city}</span>
                {value.location && (
                  <span style={{ color: "var(--muted)", fontSize: ".85rem" }}> — {value.location}</span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </div>
        )}

        {/* Clear or chevron */}
        {value && !open ? (
          <button onClick={clear} style={{ border: "none", background: "none", cursor: "pointer",
            color: "var(--muted)", padding: 2, display: "flex", alignItems: "center" }}>
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} color="var(--muted)" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: ".15s" }} />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
          background: "var(--white)", borderRadius: "var(--r)", border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,.12)", overflow: "hidden", maxHeight: 280, overflowY: "auto"
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "16px 14px", color: "var(--muted)", fontSize: ".875rem", textAlign: "center" }}>
              No results for "{query}"
            </div>
          ) : filtered.map((opt, i) => (
            <div key={i} onMouseDown={() => select(opt)}
              style={{
                padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                transition: ".1s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--green-p)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              <MapPin size={14} color="var(--green)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: ".875rem" }}>
                <span style={{ fontWeight: 700 }}>{opt.city}</span>
                {opt.location && (
                  <span style={{ color: "var(--muted)" }}> — {opt.location}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main search page ──────────────────────────────────────────────────────
function SearchContent() {
  const params = useSearchParams();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [dep, setDep] = useState<{ city: string; location: string; label: string } | null>(null);
  const [dest, setDest] = useState<{ city: string; location: string; label: string } | null>(null);
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("1");

  useEffect(() => {
    fetch(`${BASE}/trips/search?limit=100`)
      .then(r => r.json())
      .then(d => {
        const list: Trip[] = Array.isArray(d) ? d : d.trips || [];
        setAllTrips(list);
        setTrips(list);
        setLoading(false);
        setSearched(true);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build departure options: deduplicate city+location pairs
  const departureOptions: { city: string; location: string; label: string }[] = (() => {
    const seen = new Set<string>();
    const opts: { city: string; location: string; label: string }[] = [];

    // First: city-only options
    [...new Set(allTrips.map(t => t.departure_city))].sort().forEach(city => {
      const key = city + "|";
      if (!seen.has(key)) { seen.add(key); opts.push({ city, location: "", label: city }); }
    });

    // Then: city+location options
    allTrips.forEach(t => {
      if (t.departure_location) {
        const key = t.departure_city + "|" + t.departure_location;
        if (!seen.has(key)) {
          seen.add(key);
          opts.push({ city: t.departure_city, location: t.departure_location, label: `${t.departure_city} — ${t.departure_location}` });
        }
      }
    });
    return opts;
  })();

  // Build destination options: exclude selected departure city
  const destinationOptions: { city: string; location: string; label: string }[] = (() => {
    const seen = new Set<string>();
    const opts: { city: string; location: string; label: string }[] = [];

    [...new Set(allTrips
      .filter(t => !dep?.city || t.destination_city !== dep.city)
      .map(t => t.destination_city)
    )].sort().forEach(city => {
      const key = city + "|";
      if (!seen.has(key)) { seen.add(key); opts.push({ city, location: "", label: city }); }
    });

    allTrips
      .filter(t => !dep?.city || t.destination_city !== dep.city)
      .forEach(t => {
        if (t.destination_location) {
          const key = t.destination_city + "|" + t.destination_location;
          if (!seen.has(key)) {
            seen.add(key);
            opts.push({ city: t.destination_city, location: t.destination_location, label: `${t.destination_city} — ${t.destination_location}` });
          }
        }
      });
    return opts;
  })();

  function applyFilters() {
    let result = [...allTrips];
    if (dep?.city)     result = result.filter(t => t.departure_city === dep.city);
    if (dep?.location) result = result.filter(t => t.departure_location === dep.location);
    if (dest?.city)    result = result.filter(t => t.destination_city === dest.city);
    if (dest?.location)result = result.filter(t => t.destination_location === dest.location);
    if (date)          result = result.filter(t => t.departure_date === date);
    if (seats && parseInt(seats) > 1)
                       result = result.filter(t => t.available_seats >= parseInt(seats));
    setTrips(result);
    setSearched(true);
  }

  function clear() {
    setDep(null); setDest(null); setDate(""); setSeats("1");
    setTrips(allTrips); setSearched(true);
  }

  const hasFilter = dep || dest || date;

  return (
    <div className="page">
      <div className="card card-p mb-6" style={{ borderTop: "4px solid var(--green)" }}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="h3 flex items-center gap-2"><Search size={20} className="text-green" />Find a trip</h1>
          {hasFilter && (
            <button onClick={clear} className="btn btn-ghost btn-sm flex items-center gap-1">
              <X size={13} />Clear all
            </button>
          )}
        </div>

        {/* Departure */}
        <div style={{ marginBottom: 16 }}>
          <label className="label" style={{ marginBottom: 6 }}>🟢 Departure — city or pickup point</label>
          <LocationAutocomplete
            placeholder="e.g. Yaoundé or Bastos..."
            value={dep} options={departureOptions}
            onChange={opt => { setDep(opt); if (dest?.city === opt?.city) setDest(null); }}
            onClear={() => setDep(null)}
            dotColor="var(--green)"
          />
        </div>

        {/* Destination */}
        <div style={{ marginBottom: 16 }}>
          <label className="label" style={{ marginBottom: 6 }}>🟡 Destination — city or drop-off point</label>
          <LocationAutocomplete
            placeholder="e.g. Douala or Bepanda..."
            value={dest} options={destinationOptions}
            onChange={setDest} onClear={() => setDest(null)}
            dotColor="var(--gold)"
          />
        </div>

        {/* Date + Seats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Min seats</label>
            <select className="select" value={seats} onChange={e => setSeats(e.target.value)}>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}+ seat{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={applyFilters} disabled={loading} className="btn btn-primary btn-lg">
          {loading ? <><div className="spinner" />Loading...</> : <><Search size={16} />Search trips</>}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner spinner-g" style={{ margin: "0 auto 12px" }} />
          <p className="text-muted text-sm">Loading available trips...</p>
        </div>
      ) : searched && trips.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><MapPin size={28} /></div>
          <h3 className="h3 mb-2">No trips found</h3>
          <p className="text-muted text-sm mb-4">Try different cities or remove some filters.</p>
          <button onClick={clear} className="btn btn-outline btn-sm">Clear filters</button>
        </div>
      ) : searched ? (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-muted">
            <SlidersHorizontal size={14} />
            {trips.length} trip{trips.length !== 1 ? "s" : ""} available
            {(dep || dest) && (
              <span>
                {dep && <> · from <strong>{dep.label}</strong></>}
                {dest && <> → <strong>{dest.label}</strong></>}
              </span>
            )}
          </div>
          <div className="grid-3">
            {trips.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 0" }}><div className="spinner spinner-g" style={{ margin: "0 auto" }} /></div>}>
      <SearchContent />
    </Suspense>
  );
}