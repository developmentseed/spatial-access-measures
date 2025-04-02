import { useRef, useEffect, useState } from "react";
import { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";
import { Table } from "apache-arrow";
import { bbox } from "@turf/bbox";
import { getColorMap } from "../color_map";

interface Props {
  data?: Table;
  access_measure: string
}

export default function Map(props: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap>();
  const [lng] = useState(-123.1120);
  const [lat] = useState(49.2488);
  const [zoom] = useState(11.5);


  useEffect(() => {
    if (!mapContainer.current || map.current) return; // stops map from intializing more than once
    const colorMap = getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection), props.access_measure);

    map.current = new MapLibreMap({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [lng, lat],
      zoom: zoom,
      maxZoom: 14
    });
    map.current.on("load", function () {
      map.current!.addSource("da", {
        type: "geojson",
        data: JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),
      });
      map.current!.addLayer({
        "id": "da",
        "minzoom": 9.5,
        "type": "fill",
        "source": "da",
        "layout": {},
        "paint": {
          "fill-color": [
            "step",
            ["get", props.access_measure],
            ...colorMap,
            colorMap[colorMap.length - 2]
          ],
          "fill-opacity": 0.8
        }
      });
    });
  }, [lng, lat, zoom]);

  useEffect(() => {
    if (!map.current || !map.current.isSourceLoaded("da") || props.data==undefined) return;

    const boundaries = JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection);

    (map.current.getSource("da") as GeoJSONSource).setData(boundaries);
    map.current.setPaintProperty(
      "da",
      "fill-color",
      {
        property:props.access_measure,
        stops: getColorMap(boundaries,props.access_measure),
      });

    const box = bbox(boundaries);
    const [minX, minY, maxX, maxY] = box;
    map.current.fitBounds([minX, minY, maxX, maxY], { padding: 30 });

  }, [props.data]);


  useEffect(() => {
    if (!map.current || !map.current.isSourceLoaded("da") || props.data==undefined) return;

    map.current.setPaintProperty(
      "da",
      "fill-color",
      {
        property:props.access_measure,
        stops: getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),props.access_measure),
      });


  }, [props.access_measure]);


  return (
    <div>
      <div ref={mapContainer} className="map" />
    </div>
  );
}
