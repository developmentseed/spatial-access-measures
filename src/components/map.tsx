// @ts-nocheck
import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";
import { bbox } from "@turf/bbox";
import { getColorMap } from "../color_map";
import { WKBLoader } from "@loaders.gl/wkt";
import { parseSync } from "@loaders.gl/core";
import * as GeoArrow from "@geoarrow/geoarrow-js";

// import * as ApacheArrow from "apache-arrow";
import * as arrow from "apache-arrow";

// import { makeVector, Vector } from "apache-arrow";
// import { makeData, Data } from "apache-arrow/data";
// import { Table, makeTable } from "apache-arrow";
// import { Binary } from "apache-arrow";

import { Map, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { DeckProps } from "@deck.gl/core";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
const { io, vector, data } = GeoArrow;

const { makeVector, Vector, makeData, Data, Table, makeTable, Binary } = arrow;
function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function MapLayer(props: Props) {
  const [lng] = useState(-123.112);
  const [lat] = useState(49.2488);
  const [zoom] = useState(11.5);
  const [table, setTable] = useState<Table | null>(null);

  useEffect(() => {
    let geometry_wkb = props.data.getChildAt(0)?.toArray();
    let ids = props.data.getChildAt(1)?.toArray();

    console.log(ids)

    let flattenedWBK = new Uint8Array(geometry_wkb.flatMap((arr) => [...arr]));

    const valueOffsets_ = new Int32Array(geometry_wkb.length+1);

    for (let i = 1; i < geometry_wkb.length+1; i += 1) {
      let current = valueOffsets_[i - 1];
      valueOffsets_[i]=current+geometry_wkb[i-1].length;
    }

    const coordData = makeData({
      type: new Binary(),
      data: flattenedWBK,
      valueOffsets: valueOffsets_,
    });

    let polygonData = io.parseWkb(coordData, io.WKBType.Polygon, 2);

    let table = new Table({
      geometry:  makeVector(polygonData),
      sam: makeVector(ids)
    });

    table.schema.fields[0].metadata.set(
      "ARROW:extension:name",
      "geoarrow.polygon"
    );

    setTable(table);
  }, [props.data]);

  const layers = [
      table && new GeoArrowPolygonLayer({
        id: "geoarrow-polygons",
        stroked: true,
        filled: true,
        data: table,
        getFillColor: [0, 100, 60, 160],
        getLineColor: [0, 255, 0],
        lineWidthMinPixels: 1,
      }),
  ];

  return (
    (
      <Map
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: zoom,
        }}
        style={{ width: "100vw", height: "100vw", position: "absolute" }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <DeckGLOverlay layers={layers} interleaved />
      </Map>
    )
  );
}

// export default function Map(props: Props) {
//   const mapContainer = useRef<any>(null);
//   const map = useRef<any>(null);
//   const [lng] = useState(-123.1120);
//   const [lat] = useState(49.2488);
//   const [zoom] = useState(11.5);

//   useEffect(() => {
//     if (map.current) return; // stops map from intializing more than once

//     let geometry_wkb = props.data.getChildAt(0)?.toArray();

//     const coordData = arrow.makeData({
//       type: new arrow.Binary(),
//       data: geometry_wkb.buffer,
//     });

//     let polygonData = io.parseWkb(coordData, io.WKBType.Polygon, 2)
//     const polygon_table = makeTable({
//       geometry: coordData,
//     })
//     polygon_table.schema.fields[0].metadata.set("ARROW:extension:name", "geoarrow.polygon");
//     console.log(polygon_table)

//     map.current = new maplibregl.Map({
//       container: mapContainer.current,
//       style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
//       center: [lng, lat],
//       zoom: zoom,
//       maxZoom: 14
//     });
//     map.current.on("load", function () {
//       map.current.addSource("da", {
//         type: "geojson",
//         data: JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),
//       });
//       map.current.addLayer({
//         'id': 'da',
//         "minzoom": 9.5,
//         'type': 'fill',
//         'source': 'da',
//         'layout': {},
//         'paint': {
//             'fill-color': {
//               property: props.access_measure,
//               stops: getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection), props.access_measure),
//             },
//             'fill-opacity': 0.8
//         }
//       });
//     })
//   }, [lng, lat, zoom]);

//   useEffect(() => {
//     if (!map.current.isSourceLoaded('da') || props.data==undefined) return;

//     let boundaries = JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection);
//     let box = bbox(boundaries);

//     map.current.getSource("da").setData(boundaries);
//     map.current.setPaintProperty(
//       "da",
//       "fill-color",
//       {
//         property:props.access_measure,
//         stops: getColorMap(boundaries,props.access_measure),
//       })
//     map.current.fitBounds(box, { padding: 30 });

//   }, [props.data]);

//   useEffect(() => {
//     if (!map.current.isSourceLoaded('da') || props.data==undefined) return;

//     map.current.setPaintProperty(
//       "da",
//       "fill-color",
//       {
//         property:props.access_measure,
//         stops: getColorMap(JSON.parse(props.data?.toArray().map(Object.fromEntries)[0].feature_collection),props.access_measure),
//       })

//   }, [props.access_measure]);

//   return (
//     <div>
//       <div ref={mapContainer} className="map" />
//     </div>
//   );
// }

interface Props {
  data: Table;
  access_measure: string;
}
