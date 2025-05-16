import { useEffect, useMemo, useRef } from "react";
import { Map as MaplibreMap, MapRef, useControl } from "react-map-gl/maplibre";
import { Color, DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import { Table } from "apache-arrow";
import {PickingInfo} from '@deck.gl/core';
import useColorScale from "../hooks/useColorScale";

import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";

interface Props {
  data?: Table;
  coordinates?: { latitude: number; longitude: number } | null;
  access: string;
  access_class: string;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

type DataType = {
  [key: string]: number;
};

function getTooltip({object}: PickingInfo<DataType>, access: string, access_class: string) {
  if (!object) {
    return null;
  }
  const columnName = [access, access_class].join("_");
  return {
    html: `<p>${object[columnName]}</p>`,
    style: {
      backgroundColor: '#fff',
      fontSize: '1.5em',
      position: 'absolute',
      top: '-45px',
      left: '-70px',
      padding: '8px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }
  };
}

export default function Map({ data, coordinates, access, access_class }: Props) {
  const mapRef = useRef<MapRef>(null);

  const { getColor} = useColorScale(data, access, access_class);

  const layers = useMemo(() => {
    const columnName = [access, access_class].join("_");
    return [
      data && new GeoArrowPolygonLayer({
        id: `geoarrow-polygons`,
        stroked: false,
        filled: true,
        data,
        getFillColor: ({ index, data, target }) => {
          const recordBatch = data.data;
          const row = recordBatch.get(index);
          const value = row ? row[columnName]: 0;
          const [r, g, b] = getColor(value);
          target[0] = r;
          target[1] = g;
          target[2] = b;
          target[3] = 204;
          return target as Color;
        },
        lineWidthMinPixels: 0,
        updateTriggers: {
          getFillColor: columnName
        },
        pickable: true,
        autoHighlight: true,
        highlightColor: [252, 192, 38],
      }),
    ];
  }, [data, access, access_class]);

  useEffect(() => {
    if (!mapRef.current || !coordinates) return;
    mapRef.current.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 11,
      speed:0.7,
    });
  }, [coordinates]);

  return (
    <div>
      <MaplibreMap
        ref={mapRef}
        initialViewState={{
          longitude: -123.113889,
          latitude: 49.261111,
          zoom: 11
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
        <DeckGLOverlay layers={layers} getTooltip={(info) => getTooltip(info, access, access_class)} />
      </MaplibreMap>
    </div>
  );
}
