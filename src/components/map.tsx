import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";
import * as arrow from "apache-arrow";
import { bbox } from "@turf/bbox";
import { getColorMap } from "../color_map";

export default function Map(props: Props) {
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const [lng] = useState(-123.1120);
  const [lat] = useState(49.2488);
  const [zoom] = useState(11.5);

  
  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [lng, lat],
      zoom: zoom,
      maxZoom: 14
    });
    map.current.on("load", function () {
      map.current.addSource("da", {
        type: "geojson",
        data: JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),
      });
      map.current.addLayer({
        'id': 'da',
        "minzoom": 9.5,
        'type': 'fill',
        'source': 'da',
        'layout': {},
        'paint': {
            'fill-color': {
              property: props.access_measure,
              stops: getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection), props.access_measure),
            },
            'fill-opacity': 0.8
        }
      });
    })
  }, [lng, lat, zoom]);

  useEffect(() => {
    if (!map.current.isSourceLoaded('da') || props.data==undefined) return;

    let boundaries = JSON.parse(props.data.toArray().map(Object.fromEntries)[0].feature_collection);
    let box = bbox(boundaries);

    map.current.getSource("da").setData(boundaries);
    map.current.setPaintProperty(
      "da",
      "fill-color",
      {
        property:props.access_measure,
        stops: getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),props.access_measure),
      })
    map.current.fitBounds(box, { padding: 30 });

  }, [props.data]);


  useEffect(() => {
    if (!map.current.isSourceLoaded('da') || props.data==undefined) return;

    map.current.setPaintProperty(
      "da",
      "fill-color",
      {
        property:props.access_measure,
        stops: getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),props.access_measure),
      })


  }, [props.access_measure]);


  return (
    <div>
      <div ref={mapContainer} className="map" />
    </div>
  );
}

interface Props {
  data: arrow.Table|undefined;
  access_measure: string
}