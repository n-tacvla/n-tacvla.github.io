'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl } from './site';

type Sample = {t: number; valid: boolean; n: number[] | null; shear: number[] | null; direction: (number | null)[] | null; proximity: number[] | null};
type Camera = {id: string; label: string; video: string; poster: string; times: number[]};
type Recording = {episode: string; duration: number; outcome: string; technical_valid: boolean; max_age_ms: number; preview_fps: number; force_unit_N: number; labels: string[]; cameras: Camera[]; hands: Record<string, Sample[]>};
type Metric = 'n' | 'shear' | 'proximity';
const metricLabels = {n: 'Normal force', shear: 'Shear force', proximity: 'Proximity'};

function previous<T>(items: T[], t: number, time: (item: T) => number): T | undefined {
  let lo = 0, hi = items.length;
  while (lo < hi) {const mid = (lo + hi) >>> 1; if (time(items[mid]) <= t) lo = mid + 1; else hi = mid;}
  return items[lo - 1];
}
function timestamp(t: number) {return `${Math.floor(t / 60).toString().padStart(2,'0')}:${(t % 60).toFixed(1).padStart(4,'0')}`;}

function Trace({data, time, metric, onSeek}: {data: Recording; time: number; metric: Metric; onSeek: (t: number) => void}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const draw = () => {
      const box = el.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      el.width = Math.round(box.width*dpr); el.height = Math.round(box.height*dpr);
      const ctx = el.getContext('2d'); if (!ctx) return;
      ctx.scale(dpr,dpr); const w = box.width, h = box.height, pad = 10;
      const all = Object.values(data.hands).flat();
      const peak = Math.max(1,...all.map(s=>s.valid && s[metric] ? Math.max(...s[metric]!) : 0));
      ctx.strokeStyle='#daddd5'; ctx.lineWidth=1;
      for(let i=0;i<4;i++){const y=pad+i*(h-pad*2)/3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      for(const [side,color] of [['left','#b83d2d'],['right','#335b47']]) {
        ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();let connected=false,last=-Infinity;
        for(const s of data.hands[side]) {
          const values=s[metric];
          if(!s.valid || !values){connected=false;continue;}
          const x=s.t/data.duration*w, y=h-pad-Math.max(...values)/peak*(h-pad*2);
          if(!connected || (s.t-last)*1000>data.max_age_ms)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          connected=true;last=s.t;
        }
        ctx.stroke();
      }
      ctx.strokeStyle='#19211e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(time/data.duration*w,0);ctx.lineTo(time/data.duration*w,h);ctx.stroke();
    };
    draw();const observer=new ResizeObserver(draw);observer.observe(el);return()=>observer.disconnect();
  },[data,time,metric]);
  return <div className="trace-wrap"><canvas ref={canvas} className="trace" aria-label="Peak sensor readings across the recording: red for the left hand, green for the right. Click to seek." onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onSeek((e.clientX-r.left)/r.width*data.duration);}} /><div className="trace-legend"><span><i className="left-dot"/>Left hand</span><span><i className="right-dot"/>Right hand</span><span>Peak across regions · Click to seek</span></div></div>;
}

export default function Replay() {
  const [data,setData]=useState<Recording|null>(null), [error,setError]=useState('');
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[metric,setMetric]=useState<Metric>('n');
  const videos=useRef<(HTMLVideoElement|null)[]>([]);
  useEffect(()=>{const abort=new AbortController();fetch(assetUrl('sample/replay.json'),{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Failed to load replay data');return r.json() as Promise<Recording>;}).then(setData).catch(e=>{if(e.name!=='AbortError')setError('Could not load the replay. Please refresh and try again.');});return()=>abort.abort();},[]);
  useEffect(()=>{
    if(!data)return;let request=0;
    const tick=()=>{const master=videos.current[0];if(master && !master.paused){const t=Math.min(data.duration,Math.floor(master.currentTime*data.preview_fps)/data.preview_fps);setTime(t);for(const v of videos.current.slice(1)){if(v && v.readyState>=2 && Math.abs(v.currentTime-master.currentTime)>.15)v.currentTime=master.currentTime;}if(master.currentTime>=data.duration){videos.current.forEach(v=>v?.pause());setPlaying(false);setTime(data.duration);}}request=requestAnimationFrame(tick);};
    request=requestAnimationFrame(tick);return()=>cancelAnimationFrame(request);
  },[data]);
  const peaks=useMemo(()=>Object.fromEntries(['left','right'].map(side=>[side,Math.max(1,...(data?.hands[side] || []).map(s=>s.valid && s[metric] ? Math.max(...s[metric]!) : 0))])),[data,metric]);
  function seek(t: number){if(!data)return;const target=Math.min(data.duration,Math.max(0,t));setTime(target);for(const v of videos.current){if(v && v.readyState>=1)v.currentTime=target;}}
  async function toggle(){
    if(playing){videos.current.forEach(v=>v?.pause());setPlaying(false);return;}
    if(data && time>=data.duration)seek(0);
    setError('');
    try{await Promise.all(videos.current.map(v=>v?.play()));setPlaying(true);}catch{videos.current.forEach(v=>v?.pause());setPlaying(false);setError('Video is not ready or cannot play. Please try again shortly.');}
  }
  if(!data)return <div className="replay-loading" role="status">{error || 'Loading the recording…'}</div>;
  return <div className="replay" tabIndex={0} onKeyDown={e=>{if((e.target as HTMLElement).tagName!=='DIV')return;if(e.code==='Space'){e.preventDefault();void toggle();}if(e.code==='ArrowRight'){e.preventDefault();seek(time+1/data.preview_fps);}if(e.code==='ArrowLeft'){e.preventDefault();seek(time-1/data.preview_fps);}}} aria-label="Multimodal replay. Press Space to play or pause, and arrow keys to step through preview frames.">
    <div className="replay-heading"><span><span className="dot"/> RECORDED SESSION</span><span>{timestamp(data.duration)} · 15 Hz preview</span></div>
    <div className="video-grid">{data.cameras.map((camera,index)=>{
      const last=previous(camera.times,time,x=>x),missing=last===undefined,stale=!missing && (time-last)*1000>data.max_age_ms;
      return <figure key={camera.id} className={`${index===0?'head-view':''} ${stale?'stale-video':''}`}><video ref={v=>{videos.current[index]=v;}} src={assetUrl(`sample/${camera.video}`)} poster={assetUrl(`sample/${camera.poster}`)} muted playsInline preload="metadata" onLoadedMetadata={e=>{e.currentTarget.currentTime=time;e.currentTarget.playbackRate=speed;}} onEnded={()=>{videos.current.forEach(v=>v?.pause());setPlaying(false);}} onError={()=>setError('A video failed to load. Check your connection and refresh the page.')} aria-label={camera.label}/><figcaption><span>{camera.label}</span><span>{missing?'No sample yet':stale?'Frame gap':'Recorded video'}</span></figcaption></figure>;
    })}</div>
    <div className="transport"><button className="play-button" onClick={()=>void toggle()} aria-label={playing?'Pause replay':'Play replay'}>{playing?'Ⅱ':'▶'} <span>{playing?'Pause':'Play'}</span></button><button className="step" onClick={()=>seek(time-1/data.preview_fps)} aria-label="Previous preview frame">‹</button><button className="step" onClick={()=>seek(time+1/data.preview_fps)} aria-label="Next preview frame">›</button><span className="timecode">{timestamp(time)} / {timestamp(data.duration)}</span><label className="speed">Speed <select value={speed} onChange={e=>{const next=Number(e.target.value);setSpeed(next);videos.current.forEach(v=>{if(v)v.playbackRate=next;});}}>{[.25,.5,1,2].map(s=><option key={s} value={s}>{s}×</option>)}</select></label></div>
    <input className="timeline" type="range" min={0} max={data.duration} step={1/data.preview_fps} value={time} onChange={e=>seek(Number(e.target.value))} aria-label="Replay timeline" aria-valuetext={`${time.toFixed(2)} seconds`}/>
    {error && <p className="replay-error" role="alert">{error}</p>}
    <div className="sensor-header"><h3>Contact at this moment</h3><div role="group" aria-label="Select sensor metric">{(Object.keys(metricLabels) as Metric[]).map(m=><button key={m} aria-pressed={metric===m} onClick={()=>setMetric(m)}>{metricLabels[m]}</button>)}</div></div>
    <div className="sensor-grid">{['left','right'].map(side=>{
      const s=previous(data.hands[side],time,x=>x.t);
      const status=!s?'No samples':!s.valid?'Invalid sample':(time-s.t)*1000>data.max_age_ms?'Stale':'Valid';
      const values=status==='Valid'?s?.[metric]:null;
      return <div key={side} className="hand-panel"><div className="hand-heading"><h4>{side==='left'?'LEFT HAND':'RIGHT HAND'}</h4><span className={status==='Valid'?'valid':'inactive'}>{status}</span></div>{data.labels.slice(0,metric==='proximity'?5:8).map((label,i)=>{
        const raw=values?.[i],value=raw===undefined?null:metric==='proximity'?raw:raw*data.force_unit_N;
        return <div className="sensor-row" key={label}><span>{label}</span><div className="bar-track"><i style={{width:`${raw===undefined?0:raw/peaks[side]*100}%`,background:side==='left'?'#b83d2d':'#335b47'}}/></div><span title={raw===undefined?'No valid data':`Raw value ${raw}${metric==='shear' && s?.direction?.[i]!=null ? `; direction ${s.direction[i]}°` : ''}`}>{value===null?'—':metric==='proximity'?value.toLocaleString('en-US'):value.toFixed(2)}<small>{metric==='proximity'?'raw':'N'}</small></span></div>;
      })}</div>;
    })}</div>
    <Trace data={data} time={time} metric={metric} onSeek={seek}/>
    <div className="record-note"><span>Recording: {data.episode}</span><span>Outcome: {data.outcome==='failure'?'Failure':data.outcome==='success'?'Success':data.outcome} · Quality check: {data.technical_valid?'Passed':'Failed'}</span></div>
    <p className="replay-note">Replay demonstration only; this is not a successful trial or a model evaluation. Aligned by G1 receive timestamps, with 15 Hz video previews. Samples older than 100 ms are marked stale. Proximity values are raw counts, not distances.</p>
  </div>;
}
