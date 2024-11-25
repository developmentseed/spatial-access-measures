import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";

export default function Map() {
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const [lng] = useState(-123.05489829032321);
  const [lat] = useState(49.246881151735);
  const [zoom] = useState(10);

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [lng, lat],
      zoom: zoom,
    });

  }, [lng, lat, zoom]);

  return (
    <div>
      <div ref={mapContainer} className="map" />
    </div>
  );
}