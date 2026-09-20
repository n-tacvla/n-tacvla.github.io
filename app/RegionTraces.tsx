'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { METRIC_LABELS, regionsFor, traceSegments, unitFor, valueAt } from './replay-data';
import type { Hand, Metric, Recording } from './replay-data';

type HandFilter = 'both' | Hand;
const HANDS: Hand[] = ['left', 'right'];
const COLORS = { left: '#b83d2d', right: '#335b47' };
const LABELS = { left: 'Left hand', right: 'Right hand' };
const LEFT = 48, RIGHT = 12, TOP = 12, BOTTOM = 26;
function formatValue(value: number | null, metric: Metric) {
  if (value === null) return '—';
  return metric === 'proximity' ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : value.toFixed(2);
}

function RegionChart({ data, time, metric, region, handFilter, onSeek }: {
  data: Recording; time: number; metric: Metric; region: number; handFilter: HandFilter; onSeek: (time: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const background = useRef<HTMLCanvasElement | null>(null);
  const liveTime = useRef(time);
  const geometry = useRef({ width: 0, height: 0, dpr: 1 });
  const hands = useMemo(() => HANDS.filter(hand => handFilter === 'both' || handFilter === hand), [handFilter]);
  const series = useMemo(() => hands.map(hand => ({ hand, segments: traceSegments(data.hands[hand] || [], metric, region, data.force_unit_N, data.max_age_ms) })), [data, metric, region, hands]);
  const label = regionsFor(metric)[region];

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const draw = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= LEFT + RIGHT || height <= TOP + BOTTOM) return;
      const dpr = window.devicePixelRatio || 1;
      geometry.current = { width, height, dpr };
      el.width = Math.round(width * dpr); el.height = Math.round(height * dpr);
      const layer = document.createElement('canvas');
      layer.width = el.width; layer.height = el.height;
      const ctx = layer.getContext('2d'); if (!ctx) return;
      ctx.scale(dpr, dpr);
      let low = 0, high = 0;
      for (const { segments } of series) for (const segment of segments) for (const point of segment) {
        low = Math.min(low, point.value); high = Math.max(high, point.value);
      }
      if (low === high) high = 1;
      const plotWidth = width - LEFT - RIGHT, plotHeight = height - TOP - BOTTOM;
      const x = (t: number) => LEFT + t / data.duration * plotWidth;
      const y = (value: number) => TOP + (high - value) / (high - low) * plotHeight;
      ctx.font = '10px Arial'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
      for (let tick = 0; tick < 3; tick++) {
        const value = low + tick * (high - low) / 2, py = y(value);
        ctx.strokeStyle = '#e3e5dd'; ctx.beginPath(); ctx.moveTo(LEFT, py); ctx.lineTo(width - RIGHT, py); ctx.stroke();
        ctx.fillStyle = '#71776f'; ctx.textAlign = 'right';
        ctx.fillText(formatValue(value, metric), LEFT - 8, py, LEFT - 10);
      }
      for (const fraction of [0, .5, 1]) {
        ctx.textAlign = fraction === 0 ? 'left' : fraction === 1 ? 'right' : 'center';
        ctx.fillText(`${(data.duration * fraction).toFixed(1)}s`, x(data.duration * fraction), height - 9);
      }
      ctx.save(); ctx.beginPath(); ctx.rect(LEFT, TOP, plotWidth, plotHeight); ctx.clip();
      for (const { hand, segments } of series) {
        ctx.strokeStyle = COLORS[hand]; ctx.fillStyle = COLORS[hand]; ctx.lineWidth = 1.4;
        ctx.setLineDash(hand === 'right' ? [5, 2] : []);
        for (const segment of segments) {
          if (segment.length === 1) { const p = segment[0]; ctx.beginPath(); ctx.arc(x(p.t), y(p.value), 1.5, 0, 2 * Math.PI); ctx.fill(); continue; }
          ctx.beginPath(); segment.forEach((point, index) => { if (index === 0) ctx.moveTo(x(point.t), y(point.value)); else ctx.lineTo(x(point.t), y(point.value)); }); ctx.stroke();
        }
      }
      ctx.restore(); background.current = layer;
      paintCursor(liveTime.current);
    };
    function paintCursor(at: number) {
      const ctx = el?.getContext('2d'); if (!ctx || !background.current) return;
      const { width, height, dpr } = geometry.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, el!.width, el!.height); ctx.drawImage(background.current, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.strokeStyle = '#19211e'; ctx.lineWidth = 1;
      const px = LEFT + Math.max(0, Math.min(data.duration, at)) / data.duration * (width - LEFT - RIGHT);
      ctx.beginPath(); ctx.moveTo(px, TOP); ctx.lineTo(px, height - BOTTOM); ctx.stroke();
    }
    draw(); const observer = new ResizeObserver(draw); observer.observe(el);
    return () => { observer.disconnect(); background.current = null; };
  }, [data, series, metric]);

  useEffect(() => {
    liveTime.current = time;
    const el = canvas.current, layer = background.current, ctx = el?.getContext('2d');
    if (!el || !ctx || !layer) return;
    const { width, height, dpr } = geometry.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, el.width, el.height); ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.strokeStyle = '#19211e'; ctx.lineWidth = 1;
    const x = LEFT + Math.max(0, Math.min(data.duration, time)) / data.duration * (width - LEFT - RIGHT);
    ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, height - BOTTOM); ctx.stroke();
  }, [time, data]);

  return <section className="region-chart" aria-label={`${label} ${METRIC_LABELS[metric]}`}>
    <div className="region-chart-heading"><h4>{label}</h4><span>{unitFor(metric)}</span></div>
    <canvas ref={canvas} className="region-canvas" tabIndex={0} role="img" aria-label={`${label}: ${METRIC_LABELS[metric]} over time. Click to seek, or use left and right arrow keys to step.`}
      onClick={e => { const box = e.currentTarget.getBoundingClientRect(); const fraction = (e.clientX - box.left - LEFT) / (box.width - LEFT - RIGHT); onSeek(Math.max(0, Math.min(1, fraction)) * data.duration); }}
      onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); onSeek(time + (e.key === 'ArrowLeft' ? -1 : 1) / data.preview_fps); } }} />
    <div className="region-current">{hands.map(hand => <span key={hand}><i style={{ background: COLORS[hand] }} />{LABELS[hand]} <strong>{formatValue(valueAt(data, hand, metric, region, time), metric)}</strong> {unitFor(metric)}</span>)}</div>
  </section>;
}

export default function RegionTraces({ data, time, metric, onSeek }: { data: Recording; time: number; metric: Metric; onSeek: (time: number) => void }) {
  const [handFilter, setHandFilter] = useState<HandFilter>('both');
  const [region, setRegion] = useState(-1);
  const labels = regionsFor(metric);
  const selectedRegion = region < labels.length ? region : -1;
  const regions = labels.map((label, index) => ({ label, index })).filter(item => selectedRegion < 0 || item.index === selectedRegion);
  return <div className="region-traces">
    <div className="trace-controls"><h3>Regional time series</h3><div>
      <label>Hand <select value={handFilter} onChange={e => setHandFilter(e.target.value as HandFilter)}><option value="both">Both hands</option><option value="left">Left hand</option><option value="right">Right hand</option></select></label>
      <label>Region <select value={selectedRegion} onChange={e => setRegion(Number(e.target.value))}><option value={-1}>All regions</option>{labels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label>
    </div></div>
    <div className="region-legend">{handFilter !== 'right' && <span><i className="left-dot" />Left hand · solid</span>}{handFilter !== 'left' && <span><i className="right-dot" />Right hand · dashed</span>}<span>{METRIC_LABELS[metric]} · Click a plot to seek</span></div>
    <div className={`region-grid ${regions.length === 1 ? 'single-region' : ''}`}>{regions.map(({ index }) => <RegionChart key={index} data={data} time={time} metric={metric} region={index} handFilter={handFilter} onSeek={onSeek} />)}</div>
    <p className="region-note">Each plot shows one sensor region with its own vertical scale. Force is shown in N; proximity is a raw count. Invalid samples and gaps over {data.max_age_ms} ms are left blank.</p>
  </div>;
}
