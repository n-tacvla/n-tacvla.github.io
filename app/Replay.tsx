'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl } from './site';

import RegionTraces from './RegionTraces';
import { METRIC_LABELS as metricLabels, normalizeRecording, previous } from './replay-data';
import type { Recording, Metric } from './replay-data';

function timestamp(t: number) {return `${Math.floor(t / 60).toString().padStart(2,'0')}:${(t % 60).toFixed(1).padStart(4,'0')}`;}

export default function Replay() {
  const [data,setData]=useState<Recording|null>(null), [error,setError]=useState('');
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[metric,setMetric]=useState<Metric>('n');
  const videos=useRef<(HTMLVideoElement|null)[]>([]);
  useEffect(()=>{const abort=new AbortController();fetch(assetUrl(`sample/replay.json?v=${process.env.NEXT_PUBLIC_REPLAY_HASH || 'english-regions-v1'}`),{signal:abort.signal,cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Failed to load replay data');return r.json() as Promise<Recording>;}).then(recording=>setData(normalizeRecording(recording))).catch(e=>{if(e.name!=='AbortError')setError('Could not load the replay. Please refresh and try again.');});return()=>abort.abort();},[]);
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
    <RegionTraces data={data} time={time} metric={metric} onSeek={seek}/>
    <div className="record-note"><span>Recording: {data.episode}</span><span>Outcome: {data.outcome==='failure'?'Failure':data.outcome==='success'?'Success':data.outcome} · Quality check: {data.technical_valid?'Passed':'Failed'}</span></div>
    <p className="replay-note">Replay demonstration only; this is not a successful trial or a model evaluation. Aligned by G1 receive timestamps, with 15 Hz video previews. Samples older than 100 ms are marked stale. Proximity values are raw counts, not distances.</p>
  </div>;
}
