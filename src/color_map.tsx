import * as d3 from "d3";
import {
    Feature,
    FeatureCollection
} from "geojson";

const getColorMap = (data: FeatureCollection, access_measure: string) => {
    let minmax = d3.extent(data.features.map((item: Feature) => item.properties?.[access_measure]))
    let linear = d3.scaleLinear()
        .domain(minmax as unknown as number[])
        .range(["white", "red"] as unknown as number[])
    return d3.range(minmax[0] as unknown as number, minmax[1] as unknown as number, 0.1).map((x) => [x, linear(x)])
  };

export { getColorMap };
