import { DuckDBConfig } from "@duckdb/duckdb-wasm";
import { initializeDuckDb } from "duckdb-wasm-kit";

export async function setupDB() {
    const config: DuckDBConfig = {
        query: {
            castBigIntToDouble: true,
        },
      } 
    await initializeDuckDb({ config, debug: true });
    
}
