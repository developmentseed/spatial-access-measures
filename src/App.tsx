import {FormEvent, useEffect, useState } from "react";
import Map from "./components/map";

import {setupDB} from "./components/db";
import { useDuckDbQuery} from "duckdb-wasm-kit";
import { Provider } from "./components/ui/provider";
import { AbsoluteCenter, Box, createListCollection, Text,  Stack } from "@chakra-ui/react";
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


  const { arrow, loading } = useDuckDbQuery(`
    SELECT CAST({
      type: 'FeatureCollection',
      features: json_group_array(geometry_json)
    } AS JSON) as feature_collection
    FROM (SELECT CAST({
        type:'Feature',
        geometry:ST_AsGeoJSON(ST_GeomFromWKB(st_aswkb(geometry))),
        properties: {
          'acs_idx_emp':acs_idx_emp,
          'acs_idx_hf':acs_idx_hf,
          'acs_idx_srf':acs_idx_srf,
          'acs_idx_psef':acs_idx_psef,
          'acs_idx_ef':acs_idx_ef,
          'acs_idx_caf':acs_idx_caf
        }
      } AS JSON) as geometry_json,
    FROM access_measures.parquet WHERE type='${access_class}' AND CSDNAME='${city}')  ;
    `);


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
      {ready && <Map data={arrow} access_measure={access} />}
      <Box bg="white" w="20rem" p="7" position="absolute" top="4" left="4" shadow="3px 3px 4px 6px rgba(0, 0, 0, .05)">
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
        <AbsoluteCenter bg="grey" p="2" color="white" axis="both">
          <Box>
            Loading Data...
          </Box>
        </AbsoluteCenter>}
    </Provider>

  );
}

export default App;
