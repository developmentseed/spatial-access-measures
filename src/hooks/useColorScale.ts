import * as d3 from "d3";
import { useCallback, useMemo } from "react";
import { Table } from "apache-arrow";

function useColorScale(data: Table | undefined, access: string, access_class: string) {
  const { min, max } = useMemo(() => {
    if (!data) return { min: 0, max: 1 };
    const columnName = [access, access_class].join("_");
    const values = data.getChild(columnName)?.toArray();
    const extent = d3.extent(values as number[]);
    return {
      min: extent[0] ?? 0,
      max: extent[1] ?? 1
    };
  }, [data, access]);

  const scale = useMemo(() => {
    return d3.scaleSequential()
      .domain([min, max])
      .interpolator(d3.interpolateBuPu);
  }, [min, max]);

  const getColor = useCallback((value: number): [number, number, number] => {
    const rgb = scale(value);
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3])
      ];
    }
    return [200, 200, 200]; // Fallback color
  }, [scale]);

  return { getColor, min, max, scale };
}

export default useColorScale;
