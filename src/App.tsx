import {FormEvent, useEffect, useMemo, useState } from "react";
import { Binary, makeData, makeVector, Table } from "apache-arrow";
import { io } from "@geoarrow/geoarrow-js";
import { useDuckDbQuery} from "duckdb-wasm-kit";
import { AbsoluteCenter, Box, createListCollection, Text,  Stack } from "@chakra-ui/react";

import Map from "./components/map";
import { cityList } from "./data/cities";

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

const access_types =  createListCollection({
  items: [
    {label:"Public Transit (Peak)", value:"acs_public_transit_peak"},
    {label:"Public Transit (Off Peak)", value:"acs_public_transit_offpeak"},
    {label:"Cycling", value:"acs_cycling"},
    {label:"Walking", value:"acs_walking"},
  ],
});

function App() {
  const [city, setCity] = useState<string>("Vancouver");
  const [access, setAccess] = useState<string>("acs_idx_emp");
  const [access_class, setAccessClass] = useState<string>("acs_public_transit_peak");
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    console.log("setting up db");
    setupDB()
      .catch((e) => console.error(e.message));
  },[]);

  useEffect(() => {
    const fetchCityCoordinates = async () => {
      try {
        const response = await fetch(`https://geogratis.gc.ca/services/geoname/en/geonames.json?q=${city}&concise=CITY`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const cityData = data.items[0];
          setCoordinates({
            latitude: cityData.latitude,
            longitude: cityData.longitude
          });
        }
      } catch (error) {
        console.error('Error fetching city coordinates:', error);
      }
    };

    fetchCityCoordinates();
  }, [city]);

  const { arrow: data, loading } = useDuckDbQuery(`
    SELECT st_aswkb(geometry) as geometry, *
    FROM access_measures.parquet WHERE CSDNAME='${city.replace("'", "''")}';
  `);

  const table = useMemo(() => {
    if (!data) return;

    const geometry_wkb: Uint8Array[] = data.getChildAt(0)?.toArray();
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
      geometry: makeVector(polygonData as any),
      // Healthcare Facilities combinations
      acs_idx_hf_acs_cycling: makeVector(data.getChild("acs_idx_hf_acs_cycling")?.toArray()),
      acs_idx_hf_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_hf_acs_public_transit_offpeak")?.toArray()),
      acs_idx_hf_acs_public_transit_peak: makeVector(data.getChild("acs_idx_hf_acs_public_transit_peak")?.toArray()),
      acs_idx_hf_acs_walking: makeVector(data.getChild("acs_idx_hf_acs_walking")?.toArray()),
      
      // Employment combinations
      acs_idx_emp_acs_cycling: makeVector(data.getChild("acs_idx_emp_acs_cycling")?.toArray()),
      acs_idx_emp_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_emp_acs_public_transit_offpeak")?.toArray()),
      acs_idx_emp_acs_public_transit_peak: makeVector(data.getChild("acs_idx_emp_acs_public_transit_peak")?.toArray()),
      acs_idx_emp_acs_walking: makeVector(data.getChild("acs_idx_emp_acs_walking")?.toArray()),
      
      // Sport and Recreation Facilities combinations
      acs_idx_srf_acs_cycling: makeVector(data.getChild("acs_idx_srf_acs_cycling")?.toArray()),
      acs_idx_srf_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_srf_acs_public_transit_offpeak")?.toArray()),
      acs_idx_srf_acs_public_transit_peak: makeVector(data.getChild("acs_idx_srf_acs_public_transit_peak")?.toArray()),
      acs_idx_srf_acs_walking: makeVector(data.getChild("acs_idx_srf_acs_walking")?.toArray()),
      
      // Post-secondary Education combinations
      acs_idx_psef_acs_cycling: makeVector(data.getChild("acs_idx_psef_acs_cycling")?.toArray()),
      acs_idx_psef_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_psef_acs_public_transit_offpeak")?.toArray()),
      acs_idx_psef_acs_public_transit_peak: makeVector(data.getChild("acs_idx_psef_acs_public_transit_peak")?.toArray()),
      acs_idx_psef_acs_walking: makeVector(data.getChild("acs_idx_psef_acs_walking")?.toArray()),
      
      // Primary and Secondary Education combinations
      acs_idx_ef_acs_cycling: makeVector(data.getChild("acs_idx_ef_acs_cycling")?.toArray()),
      acs_idx_ef_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_ef_acs_public_transit_offpeak")?.toArray()),
      acs_idx_ef_acs_public_transit_peak: makeVector(data.getChild("acs_idx_ef_acs_public_transit_peak")?.toArray()),
      acs_idx_ef_acs_walking: makeVector(data.getChild("acs_idx_ef_acs_walking")?.toArray()),
      
      // Cultural and Arts Facilities combinations
      acs_idx_caf_acs_cycling: makeVector(data.getChild("acs_idx_caf_acs_cycling")?.toArray()),
      acs_idx_caf_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_caf_acs_public_transit_offpeak")?.toArray()),
      acs_idx_caf_acs_public_transit_peak: makeVector(data.getChild("acs_idx_caf_acs_public_transit_peak")?.toArray()),
      acs_idx_caf_acs_walking: makeVector(data.getChild("acs_idx_caf_acs_walking")?.toArray())
    });

    dataTable.schema.fields[0].metadata.set(
      "ARROW:extension:name",
      "geoarrow.polygon"
    );

    return { table: dataTable };
  }, [data])

  function handleCity(e: FormEvent<HTMLDivElement>) {
    setCity((e.target as HTMLSelectElement).value);
  }

  function handleAccess(e: FormEvent<HTMLDivElement>) {
    setAccess((e.target as HTMLSelectElement).value);
  }

  function handleAccessType(e: FormEvent<HTMLDivElement>) {
    setAccessClass((e.target as HTMLSelectElement).value);
  }

  const citiesCollection = createListCollection({
    items: cityList.map(name => ({ label: name, value: name }))
  });

  return (
    <Provider>
      {(
        <Map
          data={table?.table}
          coordinates={coordinates}
          access={access}
          access_class={access_class}
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

          <SelectRoot key="cities" size="sm" collection={citiesCollection} onChange={handleCity}>
            <SelectLabel>City</SelectLabel>
            <SelectTrigger>
              <SelectValueText placeholder={city} />
            </SelectTrigger>
            <SelectContent p="2">
              {citiesCollection.items.map((item) => (
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
