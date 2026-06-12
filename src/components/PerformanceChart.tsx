/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SecondProgress } from '../types';

interface PerformanceChartProps {
  data: SecondProgress[];
  theme: 'light' | 'dark';
}

export default function PerformanceChart({ data, theme }: PerformanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<SecondProgress | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const height = 180;
  const paddingLeft = 36;
  const paddingRight = 36;
  const paddingTop = 20;
  const paddingBottom = 24;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600 font-mono text-sm">
        No stats logged yet. Start typing to record performance telemetry.
      </div>
    );
  }

  // Find max values for scale
  const maxWpm = Math.max(...data.map((d) => d.wpm), 40) + 10;
  const maxSeconds = Math.max(...data.map((d) => d.second), 10);

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getCoords = (d: SecondProgress) => {
    const x = paddingLeft + (d.second / maxSeconds) * chartWidth;
    const yWpm = height - paddingBottom - (d.wpm / maxWpm) * chartHeight;
    const yAcc = height - paddingBottom - (d.accuracy / 100) * chartHeight;
    return { x, yWpm, yAcc };
  };

  // Build SVG Path strings
  let wpmLinePath = "";
  let wpmAreaPath = "";
  let accLinePath = "";

  data.forEach((d, i) => {
    const { x, yWpm, yAcc } = getCoords(d);
    if (i === 0) {
      wpmLinePath += `M ${x} ${yWpm}`;
      wpmAreaPath += `M ${x} ${height - paddingBottom} L ${x} ${yWpm}`;
      accLinePath += `M ${x} ${yAcc}`;
    } else {
      wpmLinePath += ` L ${x} ${yWpm}`;
      wpmAreaPath += ` L ${x} ${yWpm}`;
      accLinePath += ` L ${x} ${yAcc}`;
    }
  });

  if (data.length > 0) {
    const firstX = getCoords(data[0]).x;
    const lastX = getCoords(data[data.length - 1]).x;
    wpmAreaPath += ` L ${lastX} ${height - paddingBottom} Z`;
  }

  // Handle Mouse Hover/Move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Map mouseX back to the nearest data point
    let nearestPoint: SecondProgress | null = null;
    let minDistance = Infinity;

    data.forEach((point) => {
      const { x } = getCoords(point);
      const dist = Math.abs(x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        nearestPoint = point;
      }
    });

    if (nearestPoint && minDistance < 30) {
      setHoveredPoint(nearestPoint);
      const { x, yWpm } = getCoords(nearestPoint);
      setCoords({ x, y: yWpm });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Generate grid coordinates
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = Array.from({ length: 6 }, (_, i) => i * 10).filter(sec => sec <= maxSeconds);

  return (
    <div ref={containerRef} className="w-full relative group">
      <svg
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible select-none cursor-crosshair"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="chartWpmArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme === 'dark' ? '#3B82F6' : '#2563EB'} stopOpacity="0.18" />
            <stop offset="100%" stopColor={theme === 'dark' ? '#3B82F6' : '#2563EB'} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + (1 - tick) * chartHeight;
          const label = Math.round(tick * maxWpm);
          return (
            <g key={i} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={theme === 'dark' ? '#334155' : '#E2E8F0'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Vertical time ticks */}
        {xTicks.map((sec, i) => {
          const x = paddingLeft + (sec / maxSeconds) * chartWidth;
          return (
            <g key={i} className="opacity-40">
              <line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={height - paddingBottom}
                stroke={theme === 'dark' ? '#334155' : '#E2E8F0'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={x}
                y={height - paddingBottom + 14}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
              >
                {sec}s
              </text>
            </g>
          );
        })}

        {/* WPM Area Path */}
        {data.length > 1 && (
          <path
            d={wpmAreaPath}
            fill="url(#chartWpmArea)"
          />
        )}

        {/* WPM Line Path */}
        {data.length > 1 && (
          <path
            d={wpmLinePath}
            fill="none"
            stroke={theme === 'dark' ? '#3B82F6' : '#2563EB'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Accuracy Line Path */}
        {data.length > 1 && (
          <path
            d={accLinePath}
            fill="none"
            stroke={theme === 'dark' ? '#10B981' : '#059669'}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70"
          />
        )}

        {/* Little markers for coordinates */}
        {data.map((d, i) => {
          // If errors happened, render a tiny crimson circle on the WPM line!
          if (d.errors > 0) {
            const { x, yWpm } = getCoords(d);
            return (
              <circle
                key={`err-${i}`}
                cx={x}
                cy={yWpm}
                r={3}
                className="fill-rose-500 hover:r-5 cursor-pointer"
                title={`${d.errors} errors`}
              />
            );
          }
          return null;
        })}

        {/* Active Hover Line and Indicators */}
        {hoveredPoint && (
          <g>
            {/* Hover vertical line */}
            <line
              x1={coords.x}
              y1={paddingTop}
              x2={coords.x}
              y2={height - paddingBottom}
              stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
              strokeWidth={1}
              className="opacity-60"
            />
            {/* WPM dot marker */}
            <circle
              cx={coords.x}
              cy={getCoords(hoveredPoint).yWpm}
              r={5}
              fill={theme === 'dark' ? '#3B82F6' : '#2563EB'}
              stroke={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
              strokeWidth={2}
            />
            {/* Accuracy dot marker */}
            <circle
              cx={coords.x}
              cy={getCoords(hoveredPoint).yAcc}
              r={4}
              fill={theme === 'dark' ? '#10B981' : '#059669'}
              stroke={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
              strokeWidth={2.5}
            />
          </g>
        )}
      </svg>

      {/* Accuracy label on the right */}
      <div className="absolute right-3 top-2 flex items-center gap-4 text-[10px] font-mono text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-blue-600 dark:bg-blue-500 rounded inline-block" />
          <span>WPM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500 dark:border-emerald-400 rounded inline-block" />
          <span>Accuracy %</span>
        </div>
        {data.some(d => d.errors > 0) && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block" />
            <span>Errors</span>
          </div>
        )}
      </div>

      {/* Floating interactive tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-10 p-2.5 rounded-lg bg-slate-900/90 dark:bg-slate-800/95 text-white shadow-lg pointer-events-none transition-all duration-75 text-xs font-mono border border-slate-700/50 flex flex-col gap-1 min-w-[100px]"
          style={{
            left: `${Math.min(coords.x + 12, width - 120)}px`,
            top: `${Math.max(coords.y - 64, paddingTop)}px`,
          }}
        >
          <div className="text-slate-400 font-semibold border-b border-slate-700/50 pb-0.5 mb-0.5">
            Time: {hoveredPoint.second}s
          </div>
          <div className="flex justify-between gap-3 text-sky-400">
            <span>Speed:</span>
            <span className="font-bold">{hoveredPoint.wpm} <span className="text-[10px] opacity-75">WPM</span></span>
          </div>
          <div className="flex justify-between gap-3 text-emerald-400">
            <span>Accuracy:</span>
            <span className="font-bold">{hoveredPoint.accuracy}%</span>
          </div>
          {hoveredPoint.errors > 0 && (
            <div className="flex justify-between gap-3 text-rose-400">
              <span>Errors:</span>
              <span className="font-bold">{hoveredPoint.errors}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
