# From CSVs to Cloud-Native: Enhancing Statistics Canada's Spatial Access Measures with GeoParquet and DuckDB

Organizations releasing large and complex datasets often face a key decision: how to serve the data effectively. This can be especially difficult with census data because of the complexity of the data and the hierarchy of geographic areas associated with it. The files may be large and may exclude geographic data such as boundaries. This means users must join spatial data from other sources such as boundary files, increasing complexity and discouraging interactive exploration.

The goal of this project is to propose GeoParquet as an alternative data format for census datasets, which facilitates the use of modern tools such as DuckDB, allowing easier access and analysis for users.

## The Dataset

The [Spatial Accessibility Measures](https://www150.statcan.gc.ca/n1/pub/27-26-0001/272600012023001-eng.htm) dataset was released by Statistics Canada and measures how easily Canadians can reach key amenities (schools, healthcare, groceries, etc.) by walking, cycling, or transit. It contains accessibility scores for every census dissemination block across Canada. This dataset is invaluable for urban planners and policymakers to understand mobility and mobility barriers across urban areas. See the [methodology report](https://publications.gc.ca/site/eng/9.939806/publication.html) on how the dataset was created. Users are able to download a 51MB zip file that contains four CSV files, one for each mode of transport. 

```
spatial-access-measures/
├── acs_walking.csv
├── acs_public_transit_peak.csv
├── acs_public_transit_offpeak.csv
└── acs_cycling.csv
```

Each file contains columns for various accessibility measures for a unique [Disseminations Area (DA)](https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/az/definition-eng.cfm?ID=geo021). The DA geometries are not included in the file and must be joined from other sources such as ShapeFiles.
```
DBUID              int64     # Unique ID for a dissemination block
CMANAME            string    # Census metropolitan area or census agglomeration name

acs_idx_hf         float64   # Normalized access to health care facilities  
acs_idx_emp        float64   # Normalized access to employment  
acs_idx_srf        float64   # Normalized access to sports and recreation facilities  
acs_idx_psef       float64   # Normalized access to post-secondary education facilities  
acs_idx_ef         float64   # Normalized access to primary and secondary education facilities  
acs_idx_caf        float64   # Normalized access to cultural and arts facilities  
acs_lvl_gs-1       float64   # Minutes to closest grocery store  
acs_lvl_gs-3       float64   # Minutes to 3rd closest grocery store  
acs_lvl_gs-5       float64   # Minutes to 5th closest grocery store  
```

## What is GeoParquet?

GeoParquet is a geospatial extension of Parquet, a columnar binary file format. Parquet is highly efficient for large datasets since it stores and compresses data column-wise and supports selective reads (you only read the columns and rows you need). GeoParquet adds metadata so that one column can hold geometries (points, polygons, etc.) in Well-Known Binary (WKB) or [GeoArrow](https://geoarrow.org/format.html) format.

We transformed the SAM CSV first by joining spatial data to each record using the official [dissemination block boundaries](https://www150.statcan.gc.ca/n1/en/catalogue/92-163-X) from Statistics Canada and then saving the datatable as a Parquet file with WKB encoding ([read below]() why we went with WKB instead of GeoArrow). The result is a single file where each row has both the data (9 access indicators) and a geometry field (the polygon outline of DA). See the [transformation notebook](/notebooks/) for more details. The result is GeoParquet file that contains all our data (around 2 million row), including geometries and is just over 200MB. 

### Tips for optimizing GeoParquet Files

Optimizing GeoParquet files can significantly improve performance for cloud-based querying. Here are two key strategies to keep in mind:

#### Sort Columns

Sorting the data by one or more frequently queried columns drastically improved performance with readers like DuckDB since it skips over irrelevant data more efficiently. This is especially useful when using HTTP range requests, as only the needed byte ranges are fetched. In the SAM datasets, sorting by `CMANAME` (i.e. the city name) helped with query times.

#### Row Group Sizes

Row groups are internal blocks within a Parquet file that contain column chunks. Choosing an appropriate row group size is crucial for balancing read performance and memory usage and can have a big impact on query performance. Smaller row groups allow for more fine-grained skipping during queries but may increase file overhead. Larger row groups are more efficient for bulk reads but can slow down filtered queries. DuckDB has some [guidance](https://duckdb.org/docs/stable/guides/performance/file_formats.html#parquet-file-sizes) and benchmark testing on row group sizes and recommends around 122,880 for optimal performance. 

## Using DuckDB to Analyze GeoParquet Files

[DuckDB](https://github.com/duckdb/duckdb) is an in-process SQL database designed for fast analytical queries, similar to how SQLite works but optimized for complex data analysis. It can run directly in Python, R, or even in the browser using WebAssembly (DuckDB-WASM), making it a powerful tool for working with data without needing a server or external database. DuckDB natively supports reading Parquet files including GeoParquet, allowing users to run SQL queries directly on spatial datasets stored on disk or in the cloud, with no need to first load them into memory or a traditional database.


## Running Queries in the Browser with DuckDB-WASM

[DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) brings powerful in-browser analytics by compiling the DuckDB to WebAssembly, enabling users to query large GeoParquet datasets directly in the browser without the use of backend or APIs. It supports efficient data access through HTTP range requests, fetching only the relevant bytes based on user filters (e.g., specific columns or geographic areas). However, DuckDB-WASM has some limitations. It currently does not support multithreading, which can constrain performance on very large or complex queries. And it does not yet support [GeoArrow](https://geoarrow.org/format.html) encodings which means geometry data must be encoded using Well-known Binary (WKB) format.

## Interactive Mapping with Deck.GL

To visualize the query results efficiently, the app uses the `GeoArrowPolygonLayer` in [Deck.GL](https://github.com/geoarrow/deck.gl-layers), which is designed for high-performance rendering of polygon geometries in the GeoArrow format. The pipeline begins by querying a GeoParquet file with WKB-encoded geometries using DuckDB-WASM directly in the browser. Since DuckDB-WASM does not yet support GeoArrow encodings natively, we use the [geoarrow-js](https://github.com/geoarrow/geoarrow-js) library to convert the WKB geometries into the GeoArrow format on the client side. This converted data is then passed to `GeoArrowPolygonLayer`, enabling GPU-accelerated rendering without the overhead of converting to GeoJSON. The binary-to-binary pipeline (Parquet → Arrow with WKB → GeoArrow → Deck.GL) keeps interactions fast and responsive. 


## Implications for Data Publishers and Future Applications

Compared to traditional CSV workflows, our approach delivers major performance and usability improvements. Instead of setting up a database, ingesting data, and serving it through an API, we handle all data access using cloud-native files. It offers a practical and scalable model for sharing and exploring large geospatial datasets entirely in the browser. By combining cloud-native formats like GeoParquet with tools like DuckDB-WASM and Deck.GL, we show that interactive, serverless data exploration is not only possible but highly effective. This approach reduces friction for analysts and policymakers, eliminates the need for complex or expensive backend infrastructure, and offers a compelling alternative to traditional CSV and Shapefile workflows.