import * as d3 from "d3";
import { useCallback, useMemo } from "react";
import { Table } from "apache-arrow";

function useColorScale(data: Table | undefined, access: string) {
  const { min, max } = useMemo(() => {
    if (!data) return { min: 0, max: 1 };
    
    const values = data.getChild(access)?.toArray();
    const extent = d3.extent(values as number[]);
    return {
      min: extent[0] ?? 0,
      max: extent[1] ?? 1
    };
  }, [data, access]);

  const scale = useMemo(() => {
    return d3.scaleQuantize([min, max], d3.schemeBuPu[9]);
  }, [min, max]);

  const getColor = useCallback((value: number): [number, number, number] => {
    const hex = scale(value);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (result) {
      return result.slice(1, 4).map(c => parseInt(c, 16)) as [number, number, number];
    } else {
      return [200, 200, 200];
    }
  }, [scale]);

  return { getColor };
}

export default useColorScale;
