import { useEffect, useMemo, useRef } from "react";
import { Layer, Map as MaplibreMap, MapRef, Source } from 'react-map-gl/maplibre';
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";
import { Table } from "apache-arrow";
import { bbox } from "@turf/bbox";
import { getColorMap } from "../color_map";

interface Props {
  data?: Table;
  access_measure: string
}

export default function Map({ data, access_measure }: Props) {
  const mapRef = useRef<MapRef>(null);

  const dataGeojson = useMemo(() => {
    if (!data) {
      return {
        type: "FeatureCollection",
        features: []
      }
    }
    return JSON.parse(data.toArray().map(Object.fromEntries)[0].feature_collection);
  }, [data]);

  const colorMap = useMemo(() => {
    if (!data) return;
    return getColorMap(JSON.parse(data.toArray().map(Object.fromEntries)[0].feature_collection), access_measure);
  }, [data, access_measure]);

  useEffect(() => {
    if (!mapRef.current || !data) return;

    const boundaries = JSON.parse(data.toArray().map(Object.fromEntries)[0].feature_collection);
    const box = bbox(boundaries);
    const [minX, minY, maxX, maxY] = box;
    mapRef.current.fitBounds([minX, minY, maxX, maxY], { padding: 30 });
  }, [data])

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
        {data && colorMap && (
          <Source id="data-source" type="geojson" data={dataGeojson} promoteId="id">
            <Layer
              id="data-layer"
              type="fill"
              paint={{
                "fill-opacity": 0.8,
                "fill-color": [
                  "step",
                  ["get", access_measure],
                  ...colorMap,
                  colorMap[colorMap.length - 2]
                ]
              }}
              minzoom={9.5}
            />
          </Source>
        )}
      </MaplibreMap>
    </div>
  );
}
