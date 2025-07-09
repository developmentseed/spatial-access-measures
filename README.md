# Spatial Access Measures

👉 [Try the Live Demo](https://developmentseed.org/spatial-access-measures/)  

Spatial Access Measures is a [Statistics Canada dataset](https://www150.statcan.gc.ca/n1/pub/27-26-0001/272600012023001-eng.htm) that shows how easy it is to reach essential places like jobs, schools, healthcare, and stores using public transit, cycling, or walking. Refer to the [methodology report](https://publications.gc.ca/site/eng/9.939806/publication.html) to see how the data was created.

This project reimagines access to the SAM dataset by transforming the bulky CSVs into a lightweight, spatially-aware GeoParquet format. With this, users can run SQL queries directly in their browser—filtering, mapping, and exploring accessibility metrics for neighborhoods across Canada, all without any server backend.

![Screenshot of the Vancouver Accessibility Map](./images/sam_vancouver.png)

## Data Transformation

See the [notebooks](/notebooks/) directory for Jupyter notebooks on how CSV data was transformed into WKB encoded GeoParquet files.

## Technical Details

The app involves:

- Cloud-hosted GeoParquet dataset
- DuckDB-WASM for in-browser SQL analytics
- Apache Arrow tables piped directly into Deck.GL for rendering
- No backend server: everything runs in the browser

Full implementation notes are available in [Technical.md](./Technical.md).

## Run Locally

Minimum Node 23 required. Install Node using [nvm](https://github.com/nvm-sh/nvm).

```bash
pnpm install     # install dependencies
pnpm dev         # start local dev server
```

## Acknowledgments

- [Statistics Canada](https://www150.statcan.gc.ca/n1/pub/27-26-0001/272600012023001-eng.htm) for the Spatial Access Measures dataset
- [DuckDB](https://duckdb.org) for enabling fast, in-browser SQL analytics via DuckDB-WASM
- [Deck.GL](https://deck.gl) for high-performance GPU-based geospatial visualizations
- [GeoArrow](https://geoarrow.org) for efficient binary geospatial data interchange using Arrow format
- [Apache Arrow](https://arrow.apache.org) for powering the columnar data pipeline between DuckDB and Deck.GL

## License

Licensed under MIT. Contributions welcome!
