import * as d3 from "d3";
import {
  Feature,
  FeatureCollection
} from "geojson";
import { ExpressionInputType, ExpressionSpecification } from "maplibre-gl";

type ColorMap = [ExpressionSpecification | ExpressionInputType, ...(ExpressionSpecification | ExpressionInputType)[]]; // [string, number, ...ColorMap[]];

const getColorMap = (data: FeatureCollection, access_measure: string): ColorMap => {
  const minmax = d3.extent(data.features.map((item: Feature) => item.properties?.[access_measure]));
  const scale = d3.scaleQuantize(minmax as number[], d3.schemeBuPu[9]);
  return d3.range(minmax[0], minmax[1], 0.01).map((x) => [x, scale(x)]).map(([stop, color]) => [color, stop]).flat() as ColorMap;
};

export { getColorMap };
