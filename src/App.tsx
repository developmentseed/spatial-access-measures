import {FormEvent, useEffect, useMemo, useState } from "react";
import { Binary, makeData, makeVector, Table } from "apache-arrow";
import { io } from "@geoarrow/geoarrow-js";
import { useDuckDbQuery} from "duckdb-wasm-kit";
import { AbsoluteCenter, Spinner } from "@chakra-ui/react";

import Map from "./components/map";
import Sidebar from "./components/Sidebar";
import Histogram from "./components/Histogram";
import {setupDB} from "./components/db";
import { Provider } from "./components/ui/provider";

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
      // Healthcare Facilities
      acs_idx_hf_acs_cycling: makeVector(data.getChild("acs_idx_hf_acs_cycling")?.toArray()),
      acs_idx_hf_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_hf_acs_public_transit_offpeak")?.toArray()),
      acs_idx_hf_acs_public_transit_peak: makeVector(data.getChild("acs_idx_hf_acs_public_transit_peak")?.toArray()),
      acs_idx_hf_acs_walking: makeVector(data.getChild("acs_idx_hf_acs_walking")?.toArray()),
      
      // Employment
      acs_idx_emp_acs_cycling: makeVector(data.getChild("acs_idx_emp_acs_cycling")?.toArray()),
      acs_idx_emp_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_emp_acs_public_transit_offpeak")?.toArray()),
      acs_idx_emp_acs_public_transit_peak: makeVector(data.getChild("acs_idx_emp_acs_public_transit_peak")?.toArray()),
      acs_idx_emp_acs_walking: makeVector(data.getChild("acs_idx_emp_acs_walking")?.toArray()),
      
      // Sport and Recreation Facilities
      acs_idx_srf_acs_cycling: makeVector(data.getChild("acs_idx_srf_acs_cycling")?.toArray()),
      acs_idx_srf_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_srf_acs_public_transit_offpeak")?.toArray()),
      acs_idx_srf_acs_public_transit_peak: makeVector(data.getChild("acs_idx_srf_acs_public_transit_peak")?.toArray()),
      acs_idx_srf_acs_walking: makeVector(data.getChild("acs_idx_srf_acs_walking")?.toArray()),
      
      // Post-secondary Education
      acs_idx_psef_acs_cycling: makeVector(data.getChild("acs_idx_psef_acs_cycling")?.toArray()),
      acs_idx_psef_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_psef_acs_public_transit_offpeak")?.toArray()),
      acs_idx_psef_acs_public_transit_peak: makeVector(data.getChild("acs_idx_psef_acs_public_transit_peak")?.toArray()),
      acs_idx_psef_acs_walking: makeVector(data.getChild("acs_idx_psef_acs_walking")?.toArray()),
      
      // Primary and Secondary Education
      acs_idx_ef_acs_cycling: makeVector(data.getChild("acs_idx_ef_acs_cycling")?.toArray()),
      acs_idx_ef_acs_public_transit_offpeak: makeVector(data.getChild("acs_idx_ef_acs_public_transit_offpeak")?.toArray()),
      acs_idx_ef_acs_public_transit_peak: makeVector(data.getChild("acs_idx_ef_acs_public_transit_peak")?.toArray()),
      acs_idx_ef_acs_walking: makeVector(data.getChild("acs_idx_ef_acs_walking")?.toArray()),
      
      // Cultural and Arts Facilities
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

  return (
    <Provider>
      <Map
        data={table?.table}
        coordinates={coordinates}
        access={access}
        access_class={access_class}
      />
      <Sidebar
        city={city}
        access={access}
        access_class={access_class}
        table={table?.table}
        onCityChange={handleCity}
        onAccessChange={handleAccess}
        onAccessTypeChange={handleAccessType}
      />
      <Histogram
        data={table?.table}
        access={access}
        access_class={access_class}
      />
      {loading &&
         <AbsoluteCenter p="2" color="white" axis="both" zIndex={1000}>
            <Spinner size="xl" color='orange.500' borderWidth='4px' animationDuration='0.8s'/>
          </AbsoluteCenter>}
    </Provider>
  );
}

export default App;
