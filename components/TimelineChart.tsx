
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RecipeStep } from '../types';

interface TimelineChartProps {
  steps: RecipeStep[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ steps }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || steps.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 140 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const rowHeight = 35;
    const height = steps.length * rowHeight;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate cumulative start times
    let currentTime = 0;
    const timedSteps = steps.map(s => {
      const start = currentTime;
      currentTime += s.duration;
      return { ...s, start, end: currentTime };
    });

    const x = d3.scaleLinear()
      .domain([0, d3.max(timedSteps, d => d.end) || 0])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(timedSteps.map((_, i) => i.toString()))
      .range([0, height])
      .padding(0.2);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(() => ''));

    // Bars
    const bars = g.selectAll('.bar')
      .data(timedSteps)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.start))
      .attr('y', (_, i) => y(i.toString()) || 0)
      .attr('width', d => x(d.end) - x(d.start))
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => d.type === 'prep' ? '#10b981' : d.type === 'cook' ? '#f59e0b' : '#3b82f6')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 0.8);

    // Labels
    g.selectAll('.label')
      .data(timedSteps)
      .enter()
      .append('text')
      .attr('x', -10)
      .attr('y', (_, i) => (y(i.toString()) || 0) + y.bandwidth() / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#9ca3af')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .text(d => d.task.length > 20 ? d.task.substring(0, 18) + '...' : d.task);

    // Duration text
    g.selectAll('.duration')
      .data(timedSteps)
      .enter()
      .append('text')
      .attr('x', d => x(d.start) + (x(d.end) - x(d.start)) / 2)
      .attr('y', (_, i) => (y(i.toString()) || 0) + y.bandwidth() / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .text(d => `${d.duration}m`);

    // Axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}m`))
      .attr('color', '#4b5563');

  }, [steps]);

  return (
    <div className="w-full overflow-x-auto bg-slate-900/40 p-6 rounded-3xl border border-white/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.2em]">Cooking Orchestration Timeline</h3>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-bold text-slate-500 uppercase">Prep</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[9px] font-bold text-slate-500 uppercase">Cook</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] font-bold text-slate-500 uppercase">Rest</span></div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full" style={{ minHeight: `${steps.length * 35 + 60}px` }} />
    </div>
  );
};

export default TimelineChart;
