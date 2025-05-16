import { Box, Text } from "@chakra-ui/react";
import { ScaleSequential } from "d3";
import { useEffect, useRef } from "react";

interface LegendProps {
  scale?: ScaleSequential<string, never>;
  min?: number;
  max?: number;
}

const Legend = ({ scale, min, max }: LegendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (scale && typeof min === 'number' && typeof max === 'number') {
      // Create gradient
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
      const numStops = 10;
      for (let i = 0; i <= numStops; i++) {
        const value = min + (max - min) * (i / numStops);
        gradient.addColorStop(i / numStops, scale(value));
      }
      context.fillStyle = gradient;
    } else {
      // Placeholder gradient (e.g., light gray)
      context.fillStyle = "#e0e0e0"; // Light gray color
    }
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [scale, min, max]);

  return (
    <Box>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%',
          height: '20px',
          borderRadius: "4px"
        }} 
      />
      <Box display="flex" justifyContent="space-between" mt="1">
        <Text fontSize="xs">{typeof min === 'number' ? min.toFixed(2) : "-"}</Text>
        <Text fontSize="xs">
          {typeof min === 'number' && typeof max === 'number'
            ? ((min + max) / 2).toFixed(2)
            : "-"}
        </Text>
        <Text fontSize="xs">{typeof max === 'number' ? max.toFixed(2) : "-"}</Text>
      </Box>
    </Box>
  );
};

export default Legend; 