import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Table } from 'apache-arrow';

interface HistogramProps {
  data: Table | undefined;
  access: string;
  access_class: string;
}

const Histogram = ({ data, access, access_class }: HistogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Set up dimensions
  const margin = { top: 40, right: 20, bottom: 40, left: 40 };
  const width = 300 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous histogram
    d3.select(svgRef.current).selectAll('*').remove();

    // Get the column name based on access and access_class
    const columnName = `${access}_${access_class}`;
    const column = data.getChild(columnName);
    if (!column) return;
    
    const values = column.toArray() as number[];
    if (!values.length) return;

    // Calculate median
    const median = d3.quantile(values, 0.50) || 0;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales with fixed number of ticks
    const x = d3.scaleLinear()
      .domain([0, d3.max(values) || 0])
      .range([0, width])
      .nice();

    const histogram = d3.histogram()
      .domain(x.domain() as [number, number])
      .thresholds(d3.range(0, d3.max(values) || 0, (d3.max(values) || 0) / 10)); // Force exactly 10 bins

    const bins = histogram(values);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .range([height, 0])
      .nice();

    // Add title
    const getAccessMeasureName = (access: string) => {
      const measures: { [key: string]: string } = {
        'acs_idx_emp': 'Employment',
        'acs_idx_hf': 'Healthcare Facilities',
        'acs_idx_srf': 'Sport and Recreation Facilities',
        'acs_idx_psef': 'Post-secondary Education',
        'acs_idx_ef': 'Primary and Secondary Education',
        'acs_idx_caf': 'Cultural and Arts Facilities'
      };
      return measures[access] || access;
    };

    const getTravelModeName = (mode: string) => {
      const modes: { [key: string]: string } = {
        'acs_public_transit_peak': 'Public Transit (Peak Hours)',
        'acs_public_transit_offpeak': 'Public Transit (Off-Peak Hours)',
        'acs_walking': 'Walking',
        'acs_cycling': 'Cycling'
      };
      return modes[mode] || mode;
    };

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2 - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#5c5c5c')
      .style('letter-spacing', '-0.5px')
      .text(getAccessMeasureName(access));

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2 + 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#5c5c5c')
      .style('letter-spacing', '-0.5px')
      .text(getTravelModeName(access_class));

    // Add bars with adjusted y position
    svg.selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', d => x(d.x0 ?? 0))
      .attr('y', d => y(d.length) + 10) // Add 10px margin below title
      .attr('width', d => x(d.x1 ?? 0) - x(d.x0 ?? 0) - 5) // Increased spacing between bars from 3 to 5 pixels
      .attr('height', d => Math.max(0, height - y(d.length) - 10)) // Ensure height is never negative
      .style('fill', '#3b157d');

    // Add median line with adjusted y position
    const xPos = x(median);
    
    // Add vertical line
    svg.append('line')
      .attr('x1', xPos)
      .attr('y1', 10) // Add 10px margin below title
      .attr('x2', xPos)
      .attr('y2', height)
      .style('stroke', '#38A169')
      .style('stroke-width', 1.5)
      .style('stroke-dasharray', '3,3');

    // Add label
    svg.append('text')
      .attr('x', xPos)
      .attr('y', 5) // Adjust label position
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#5c5c5c')
      .text('Median');

    // Add x-axis with fixed number of ticks
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#5c5c5c');

    // Add x-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#5c5c5c')
      .text('Access Score');

    // Add y-axis with fixed number of ticks
    svg.append('g')
      .attr('transform', `translate(0,10)`) // Add 10px margin below title
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#5c5c5c');

    // Style the axis lines
    svg.selectAll('.domain')
      .style('stroke', '#5c5c5c');
    
    svg.selectAll('.tick line')
      .style('stroke', '#5c5c5c');

  }, [data, access, access_class]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      right: '30px',
      background: '#fffcf5',
      padding: '5px',
      boxShadow: '0 5px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      width: `${width + margin.left + margin.right + 10}px`,
      height: `${height + margin.top + margin.bottom + 10}px`
    }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Histogram; 