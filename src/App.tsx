import {FormEvent, useEffect, useMemo, useState } from "react";
import { Binary, makeData, makeVector, Table } from "apache-arrow";
import { io, algorithm } from "@geoarrow/geoarrow-js";
import { useDuckDbQuery} from "duckdb-wasm-kit";
import { AbsoluteCenter, Box, createListCollection, Text,  Stack } from "@chakra-ui/react";
import * as d3 from "d3";

import Map from "./components/map";

import {setupDB} from "./components/db";
import { Provider } from "./components/ui/provider";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./components/ui/select";


const cities = createListCollection({
  items: [
    { label: "Calgary", value: "Calgary" },
    { label: "Vancouver", value: "Vancouver" },
    { label: "Edmonton", value: "Edmonton" },
    { label: "Toronto", value: "Toronto" },
    { label: "Burnaby", value: "Burnaby" },
    { label: "London", value: "London" },
    { label: "Saskatoon", value: "Saskatoon" },
    { label: "Regina", value: "Regina" },
    { label: "Winnipeg", value: "Winnipeg" },
  ],
});

const access_categories = createListCollection({
  items: [
    {label:"Employment", value:"acs_idx_emp"},
    {label:"Healthcare Facilities", value:"acs_idx_hf"},
    {label:"Primary and Secondary Education", value:"acs_idx_ef"},
    {label:"Post-secondary Education", value:"acs_idx_psef"},
    {label:"Sport and Recreation Facilities", value:"acs_idx_srf"},
    {label:"Cultural and Arts Facilities", value:"acs_idx_caf"}
  ],
});

const percentiles = createListCollection({
  items: [
    { label: "10%", value: 0.1 },
    { label: "25%", value: 0.25 },
    { label: "40%", value: 0.4 },
    { label: "50% (Median)", value: 0.5 },
    { label: "70%", value: 0.7 },
    { label: "90%", value: 0.9 }
  ],
});

const access_types =  createListCollection({
  items: [
    {label:"Public Transit (Peak)", value:"acs_public_transit_peak"},
    {label:"Public Transit (Off Peak)", value:"acs_public_transit_offpeak"},
    {label:"Cycling", value:"acs_cycling"},
    {label:"Walking", value:"acs_walking"},
  ],
});

function App() {

  const [ready, setReady] = useState(false);
  const [city, setCity] = useState<string>("Vancouver");
  const [access, setAccess] = useState<string>("acs_idx_emp");
  const [access_class, setAccessClass] = useState<string>("acs_public_transit_peak");
  const [percentile, setPercentile] = useState<number>(0.99); // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    console.log("setting up db");
    setupDB()
      .then(() => setReady(true))
      .catch((e) => console.error(e.message));
  },[]);


  const { arrow: data, loading } = useDuckDbQuery(`
    SELECT st_aswkb(geometry) as geometry, ${access}
    FROM access_measures.parquet WHERE type='${access_class}' AND CSDNAME='${city}';
  `);

  const table = useMemo(() => {
    if (!data) return;

    const geometry_wkb: Uint8Array[] = data.getChildAt(0)?.toArray();
    const values = data.getChildAt(1)?.toArray();
    const flattenedWKB = new Uint8Array(geometry_wkb.flatMap((arr) => [...arr]));
    const valueOffsets = new Int32Array(geometry_wkb.length + 1);

    for (let i = 0, len = geometry_wkb.length; i < len; i++) {
      const current = valueOffsets[i];
      valueOffsets[i + 1] = current + geometry_wkb[i].length;
    }

    const coordData = makeData({
      type: new Binary(),
      data: flattenedWKB,
      valueOffsets,
    });
    const polygonData = io.parseWkb(coordData, io.WKBType.Polygon, 2);

    const dataTable = new Table({
      geometry: makeVector(polygonData),
      sam: makeVector(values)
    });

    dataTable.schema.fields[0].metadata.set(
      "ARROW:extension:name",
      "geoarrow.polygon"
    );

    const bbox = algorithm.totalBounds(dataTable.getChildAt(0)!,dataTable.schema.fields[0]);
    
    // Convert bbox to [minX, minY, maxX, maxY] format
    const formattedBbox: [number, number, number, number] = [
      bbox.minX,
      bbox.minY,
      bbox.maxX,
      bbox.maxY
    ];

    return { table: dataTable, bbox: formattedBbox };
  }, [data])

  function handleCity(e: FormEvent<HTMLDivElement>) {
    setCity((e.target as HTMLSelectElement).value);
  }

  function handleAccess(e: FormEvent<HTMLDivElement>) {
    setAccess((e.target as HTMLSelectElement).value);
  }

  function handlePercentile(e: FormEvent<HTMLDivElement>) {
    setPercentile(parseFloat((e.target as HTMLSelectElement).value));
  }

  function handleAccessType(e: FormEvent<HTMLDivElement>) {
    setAccessClass((e.target as HTMLSelectElement).value);
  }

  return (
    <Provider>
      {ready && (
        <Map
          data={table?.table}
          bbox={table?.bbox}
        />
      )}
      <Box bg="white" w="20rem" p="7" position="absolute" top="4" left="4" boxShadow="md" zIndex={1000}>
        <Text textStyle="4xl">Spatial Access Measures </Text>

        <Text py="4">Statistics Canada data that quantifies the ease of reaching destinations from an origin dissemination block (DB).</Text>

        <Stack gap="5">

          <SelectRoot key="access_type" size="sm" collection={access_types} onChange={handleAccessType}>
            <SelectTrigger>
              <SelectValueText placeholder="Public Transit (Peak)" />
            </SelectTrigger>
            <SelectContent p="2">
              {access_types.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>

          <SelectRoot key="cities" size="sm" collection={cities} onChange={handleCity}>
            <SelectLabel>City</SelectLabel>
            <SelectTrigger>
              <SelectValueText placeholder={city} />
            </SelectTrigger>
            <SelectContent p="2">
              {cities.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>

          <SelectRoot key="access" size="sm" collection={access_categories} onChange={handleAccess}>
            <SelectLabel>Access Measure</SelectLabel>
            <SelectTrigger>
              <SelectValueText placeholder="Employment" />
            </SelectTrigger>
            <SelectContent p="3">
              {access_categories.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>

          <SelectRoot disabled key="percentile" size="sm" collection={percentiles} onChange={handlePercentile}>
            <SelectLabel>Percentile</SelectLabel>
            <SelectTrigger>
              <SelectValueText placeholder="50%" />
            </SelectTrigger>
            <SelectContent p="3">
              {percentiles.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Stack>

      </Box>

      {loading &&
        <AbsoluteCenter bg="grey" p="2" color="white" axis="both" zIndex={1000}>
          <Box>
            Loading Data...
          </Box>
        </AbsoluteCenter>}
    </Provider>

  );
}

export default App;
