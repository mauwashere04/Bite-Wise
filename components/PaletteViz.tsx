
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PaletteVizProps {
  colors: string[];
}

const PaletteViz: React.FC<PaletteVizProps> = ({ colors }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || colors.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 400;
    const height = 100;
    const padding = 6;
    const rectWidth = (width - (colors.length + 1) * padding) / colors.length;

    const g = svg.append('g');

    colors.forEach((color, i) => {
      const x = padding + i * (rectWidth + padding);
      
      const rectG = g.append('g')
        .attr('transform', `translate(${x}, 5)`);

      rectG.append('rect')
        .attr('width', rectWidth)
        .attr('height', 60)
        .attr('rx', 8)
        .attr('fill', color)
        .style('opacity', 0)
        .transition()
        .delay(i * 100)
        .duration(600)
        .style('opacity', 1);

      rectG.append('text')
        .attr('x', rectWidth / 2)
        .attr('y', 75)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '9px')
        .text(color.toUpperCase());
    });

  }, [colors]);

  return (
    <div className="w-full">
      <h3 className="text-[10px] font-bold text-amber-500/80 mb-3 uppercase tracking-[0.2em]">Taste Profile Palette</h3>
      <svg ref={svgRef} className="w-full h-[90px]" />
    </div>
  );
};

export default PaletteViz;
