import * as d3 from "d3";
import {
    Feature,
    FeatureCollection
} from "geojson";

const getColorMap = (data: FeatureCollection, access_measure: string) => {
    let minmax = d3.extent(data.features.map((item: Feature) => item.properties?.[access_measure]))
    let scale = d3.scaleQuantize(minmax as unknown as number[], d3.schemeBuPu[9]);
    return d3.range(minmax[0] as unknown as number, minmax[1] as unknown as number, 0.01).map((x) => [x, scale(x)])
  };

export { getColorMap };
