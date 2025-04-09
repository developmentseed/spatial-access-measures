import { useEffect, useMemo, useRef } from "react";
import { Map as MaplibreMap, MapRef, useControl } from "react-map-gl/maplibre";
import { Color, DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import { Table } from "apache-arrow";
import useColorScale from "../hooks/useColorScale";

import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";

interface Props {
  data?: Table;
  bbox?: [number, number, number, number];
  min: number;
  max: number;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function Map({ data, bbox, min, max }: Props) {
  const mapRef = useRef<MapRef>(null);

  const { getColor } = useColorScale(min, max);

  const layers = useMemo(() => {
    return [
      data && new GeoArrowPolygonLayer({
        id: "geoarrow-polygons",
        stroked: false,
        filled: true,
        data,
        getFillColor: ({ index, data, target }) => {
          const recordBatch = data.data;
          const row = recordBatch.get(index);
          const value = row ? row["sam"]: 0;
          const [r, g, b] = getColor(value);
          target[0] = r;
          target[1] = g;
          target[2] = b;
          target[3] = 204;
          return target as Color;
        },
        lineWidthMinPixels: 0,
      }),
    ];
  }, [data, getColor]);

  useEffect(() => {
    if (!mapRef.current || !bbox) return;
    mapRef.current.fitBounds(bbox, { padding: 30 });
  }, [bbox]);

  return (
    <div>
      <MaplibreMap
        ref={mapRef}
        initialViewState={{
          longitude: -123.1120,
          latitude: 49.2488,
          zoom: 11.5
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <DeckGLOverlay layers={layers} />
      </MaplibreMap>
    </div>
  );
}
