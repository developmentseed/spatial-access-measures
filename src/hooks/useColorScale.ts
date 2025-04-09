import * as d3 from "d3";
import { useCallback, useMemo } from "react";

function useColorScale(min: number, max: number) {
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

  return {
    getColor
  };
}

export default useColorScale;
