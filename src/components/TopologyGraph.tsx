/**
 * Topology Graph Component
 *
 * Visualizes GPU NVLink topology using D3.js.
 * Shows GPU nodes and their interconnections with health status.
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { DGXNode } from '@/types/hardware';
import { Network } from 'lucide-react';

interface TopologyGraphProps {
  node: DGXNode;
}

interface GraphNode {
  id: number;
  name: string;
  health: string;
  utilization: number;
  temperature: number;
  x: number;
  y: number;
}

interface GraphLink {
  source: GraphNode;
  target: GraphNode;
  status: string;
  bandwidth: string;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ node }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 500;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create nodes for each GPU
    const nodes: GraphNode[] = node.gpus.map((gpu, idx) => ({
      id: gpu.id,
      name: `GPU ${idx}`,
      health: gpu.healthStatus,
      utilization: gpu.utilization,
      temperature: gpu.temperature,
      // Position in a grid layout (2 rows x 4 columns for 8 GPUs)
      x: (idx % 4) * 180 + 120,
      y: Math.floor(idx / 4) * 250 + 120,
    }));

    // Create links for NVLink connections
    // Since NVLinkConnection doesn't have remoteDeviceId, create a full mesh for demonstration
    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // In a real DGX system, GPUs 0-3 and 4-7 are typically interconnected
        const shouldConnect = Math.floor(i / 4) === Math.floor(j / 4) || (j === i + 1) || (j === i + 4);
        if (shouldConnect && node.gpus[i].nvlinks.length > 0) {
          const link = node.gpus[i].nvlinks[Math.min(i, node.gpus[i].nvlinks.length - 1)];
          links.push({
            source: nodes[i],
            target: nodes[j],
            status: link.status,
            bandwidth: `${link.speed} GB/s`,
          });
        }
      }
    }

    // Draw links
    const linkGroup = svg.append('g').attr('class', 'links');

    linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)
      .attr('stroke', (d) => (d.status === 'Active' ? '#10B981' : '#EF4444'))
      .attr('stroke-width', (d) => (d.status === 'Active' ? 3 : 1))
      .attr('stroke-dasharray', (d) => (d.status === 'Active' ? '0' : '5,5'))
      .attr('opacity', 0.6)
      .append('title')
      .text((d) => `${d.source.name} ↔ ${d.target.name}\nStatus: ${d.status}\nBandwidth: ${d.bandwidth}`);

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const nodeGroups = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer');

    // Node circles
    nodeGroups
      .append('circle')
      .attr('r', 35)
      .attr('fill', (d) => {
        if (d.health === 'Critical') return '#EF4444';
        if (d.health === 'Warning') return '#F59E0B';
        if (d.temperature > 80) return '#F59E0B';
        return '#10B981';
      })
      .attr('stroke', '#1F2937')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9);

    // Utilization ring
    nodeGroups.each(function (d) {
      const angle = (d.utilization / 100) * 360;
      const radians = (angle * Math.PI) / 180;
      const x = 40 * Math.sin(radians);
      const y = -40 * Math.cos(radians);

      d3.select(this)
        .append('path')
        .attr('d', `M 0,-40 A 40,40 0 ${angle > 180 ? 1 : 0},1 ${x},${y}`)
        .attr('stroke', '#76B900')
        .attr('stroke-width', 4)
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round');
    });

    // GPU number text
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#fff')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text((d) => String(d.id));

    // Temperature text
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', '#fff')
      .attr('font-size', '11px')
      .text((d) => `${Math.round(d.temperature)}°C`);

    // Add tooltips
    nodeGroups.append('title').text(
      (d) =>
        `${d.name}\nHealth: ${d.health}\nUtilization: ${Math.round(d.utilization)}%\nTemperature: ${Math.round(d.temperature)}°C`
    );

    // Add hover effects
    nodeGroups
      .on('mouseover', function () {
        d3.select(this).select('circle').attr('r', 40).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('r', 35).attr('opacity', 0.9);
      });
  }, [node]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-nvidia-green" />
        <h3 className="text-lg font-semibold text-gray-200">NVLink Topology - {node.id}</h3>
      </div>

      <svg ref={svgRef} className="w-full bg-gray-900 rounded-lg" />

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-300">Healthy GPU</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span className="text-gray-300">Warning / Hot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-gray-300">Critical GPU</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500" />
          <span className="text-gray-300">Active NVLink</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        <p>• Green ring around GPU = Utilization level</p>
        <p>• Hover over nodes/links for details</p>
        <p>• Active NVLinks shown as solid green lines</p>
      </div>
    </div>
  );
};
