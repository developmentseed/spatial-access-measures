// import React from 'react';
import {useEffect } from "react";
import Map from "./components/map";
// import {setupDB} from "./components/db"

import { DuckDBConfig } from "@duckdb/duckdb-wasm";
import { initializeDuckDb } from "duckdb-wasm-kit";

function App() {

  useEffect(() => {
    console.log("setting up db")
    // setupDB()
    const config: DuckDBConfig = {
      query: {
          /**
           * By default, int values returned by DuckDb are Int32Array(2).
           * This setting tells DuckDB to cast ints to double instead,
           * so they become JS numbers.
           */
          castBigIntToDouble: true,
      },
    }
    initializeDuckDb({ config, debug: true });
  },[])


  return (
    <Map />
  );
}

export default App;
