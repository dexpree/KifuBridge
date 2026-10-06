import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { useState, useEffect, useRef, useCallback } from "react";

import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Roughly India's geographic center — the map opens here, zoomed out to
// the whole country, rather than hard-committing to any one city.
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_ZOOM = 5;

// Loose India bounding box (with a little padding) so the demo map can't be
// panned off into the ocean or another continent.
const INDIA_BOUNDS = [
  [6.0, 67.0],
  [37.6, 98.0],
];

// Zoom level to jump to the moment an actual location is picked — search
// result, current location, a quick-city button, or a map click.
const LOCATION_ZOOM = 16;

const REVERSE_GEOCODE_DEBOUNCE_MS = 500;
// Above this, GPS/network accuracy is too coarse to trust for an address pin.
const LOW_ACCURACY_THRESHOLD_M = 100;

// A handful of major cities for quick demo access — Bengaluru first since
// that's the one most likely to get exercised day to day.
const QUICK_CITIES = [
  { label: "Bengaluru", center: [12.9716, 77.5946] },
  { label: "Delhi", center: [28.6139, 77.209] },
  { label: "Mumbai", center: [19.076, 72.8777] },
  { label: "Chennai", center: [13.0827, 80.2707] },
  { label: "Kolkata", center: [22.5726, 88.3639] },
  { label: "Hyderabad", center: [17.385, 78.4867] },
];

function ChangeMapView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

// Lets the user tap anywhere on the map to drop/move the pin — active even
// before a marker exists, so the very first interaction on the India-wide
// view already works.
function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function DraggableMarker({ position, onDragEnd }) {
  return (
    <Marker
      draggable
      position={position}
      eventHandlers={{
        dragend: (e) => {
          const pos = e.target.getLatLng();
          onDragEnd(pos.lat, pos.lng);
        },
      }}
    />
  );
}

// Builds a clean street-level address instead of falling back to Nominatim's
// full display_name (which is a long "everything we know" string, e.g.
// "12, MG Road, Shanthala Nagar, Bengaluru Urban, Karnataka, 560001, India").
// We compose the smallest set of components that actually identifies the
// spot, and only resort to display_name as an absolute last resort.
function buildAddressLine(address) {
  const streetPart = [address.house_number, address.road]
    .filter(Boolean)
    .join(" ");

  return (
    streetPart ||
    address.neighbourhood ||
    address.suburb ||
    address.village ||
    address.display_name ||
    ""
  );
}

export default function LocationPicker({ onLocationChange, onAddressChange }) {
  // No marker until the user actually picks a spot — the map opens on all
  // of India rather than presuming a city, so nothing should silently
  // autofill the address fields before the user has done anything.
  const [position, setPosition] = useState(null);
  const [viewCenter, setViewCenter] = useState(INDIA_CENTER);
  const [viewZoom, setViewZoom] = useState(INDIA_ZOOM);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [accuracyMeters, setAccuracyMeters] = useState(null);

  // Guards against two overlapping problems with the free Nominatim API:
  // 1) hammering it with a request per pixel while the marker is dragged
  //    (debounce), and 2) an earlier slow response landing after a newer
  // one and overwriting the address fields with stale data (abort + a
  // request-id check).
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Central place to move the pin. `recenter: true` also snaps the map to
  // street-level zoom on that spot (search / current-location / quick-city
  // / a fresh map click); dragging an existing pin leaves the zoom alone
  // since the user is already looking at the right area.
  const selectPosition = (lat, lng, { recenter = false } = {}) => {
    setPosition([lat, lng]);
    if (recenter) {
      setViewCenter([lat, lng]);
      setViewZoom(LOCATION_ZOOM);
    }
  };

  const reverseGeocode = useCallback(
    (lat, lng) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const thisRequestId = ++requestIdRef.current;
        setIsResolvingAddress(true);

        try {
          // zoom=18 asks Nominatim for building/street-level granularity
          // instead of its default (which can round up to suburb level).
          // addressdetails=1 is implied by jsonv2 but is made explicit here
          // since it's load-bearing for buildAddressLine below.
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
            { signal: controller.signal }
          );
          const data = await res.json();

          // A newer request has since been kicked off — drop this result.
          if (thisRequestId !== requestIdRef.current) return;
          if (!data.address) return;

          onAddressChange({
            address: buildAddressLine(data.address),
            city:
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.suburb ||
              "",
            state: data.address.state || "",
            pincode: data.address.postcode || "",
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Reverse geocode failed:", error);
          }
        } finally {
          if (thisRequestId === requestIdRef.current) {
            setIsResolvingAddress(false);
          }
        }
      }, REVERSE_GEOCODE_DEBOUNCE_MS);
    },
    [onAddressChange]
  );

  // Only fires once a position actually exists — the India-wide starting
  // view has no marker, so nothing gets geocoded until the user picks a spot.
  useEffect(() => {
    if (!position) return;
    onLocationChange(position);
    reverseGeocode(position[0], position[1]);
  }, [position, onLocationChange, reverseGeocode]);

  // Clean up any in-flight debounce/request on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const searchLocation = async () => {
    if (!search.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      // countrycodes=in biases results to India (this is a KifuBridge-only
      // app, so a same-named place abroad should never outrank a local
      // match). limit=5 + returning a picker instead of auto-taking
      // data[0] is the main accuracy fix here — a query like "MG Road" is
      // genuinely ambiguous and silently picking the first hit is how you
      // end up with a pin in the wrong city.
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          search
        )}&countrycodes=in&addressdetails=1&limit=5`
      );
      const data = await res.json();

      if (data.length === 0) {
        alert("Location not found.");
        return;
      }

      if (data.length === 1) {
        selectPosition(parseFloat(data[0].lat), parseFloat(data[0].lon), {
          recenter: true,
        });
        setSearchResults([]);
      } else {
        // Multiple plausible matches — let the user pick instead of guessing.
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Location search failed:", error);
      alert("Something went wrong while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    selectPosition(parseFloat(result.lat), parseFloat(result.lon), {
      recenter: true,
    });
    setSearchResults([]);
  };

  const goToQuickCity = (city) => {
    setSearchResults([]);
    selectPosition(city.center[0], city.center[1], { recenter: true });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (location) => {
        selectPosition(location.coords.latitude, location.coords.longitude, {
          recenter: true,
        });
        setAccuracyMeters(Math.round(location.coords.accuracy));
        setIsLocating(false);
      },
      () => {
        alert("Unable to get your current location.");
        setIsLocating(false);
      },
      {
        // Without this, browsers are free to return a fast but coarse
        // network/IP-based fix (can be off by hundreds of meters to km+)
        // instead of an actual GPS reading.
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div>
      <div className="d-flex gap-2 mb-2 flex-wrap">
        <button
          type="button"
          className="btn btn-primary"
          onClick={useCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? "Locating..." : "📍 Use Current Location"}
        </button>

        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search anywhere in India..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              searchLocation();
            }
          }}
        />

        <button
          type="button"
          className="btn btn-success"
          onClick={searchLocation}
          disabled={isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {QUICK_CITIES.map((city) => (
          <button
            key={city.label}
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => goToQuickCity(city)}
          >
            {city.label}
          </button>
        ))}
      </div>

      {searchResults.length > 0 && (
        <div className="list-group mb-3">
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              type="button"
              className="list-group-item list-group-item-action"
              onClick={() => selectSearchResult(result)}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      {isResolvingAddress && (
        <div className="text-muted small mb-2"></div>
      )}

      {accuracyMeters !== null && !isLocating && (
        <div
          className={`small mb-2 ${
            accuracyMeters > LOW_ACCURACY_THRESHOLD_M
              ? "text-warning"
              : "text-muted"
          }`}
        >
          Location accuracy: ~{accuracyMeters} m
          {accuracyMeters > LOW_ACCURACY_THRESHOLD_M &&
            " — consider adjusting the pin manually for a precise address."}
        </div>
      )}

      {!position && (
        <div className="text-muted small mb-2">
          Tap anywhere on the map, search, or pick a city to drop a pin.
        </div>
      )}

      <MapContainer
        center={viewCenter}
        zoom={viewZoom}
        minZoom={4}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{
          height: "350px",
          width: "100%",
          borderRadius: "15px",
        }}
      >
        <ChangeMapView center={viewCenter} zoom={viewZoom} />

        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onSelect={(lat, lng) => selectPosition(lat, lng, { recenter: true })}
        />

        {position && (
          <DraggableMarker
            position={position}
            onDragEnd={(lat, lng) => selectPosition(lat, lng)}
          />
        )}
      </MapContainer>
    </div>
  );
}