import { useState, useRef, useEffect } from 'react';
import { CheckCircle, ZoomIn, Lightbulb, Crosshair, Camera, AlertTriangle, Droplets, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useLabControls } from './labControls';

export interface SharePayload {
  v: number;
  obs: string[];
  specimen: string;
  mag: number;
  totalMag: number;
}

export const SHARE_HASH_PREFIX = 'm-obs=';
export const SHARE_KEY = 'microscope.sharedObs';

export function encodeShare(payload: SharePayload): string {
  return encodeURIComponent(JSON.stringify(payload));
}
export function decodeShare(encoded: string): SharePayload | null {
  try {
    const p = JSON.parse(decodeURIComponent(encoded)) as SharePayload;
    if (p && Array.isArray(p.obs)) return p;
    return null;
  } catch {
    return null;
  }
}
export function readShareFromHash(): SharePayload | null {
  if (typeof window === 'undefined') return null;
  const idx = window.location.hash.indexOf(SHARE_HASH_PREFIX);
  if (idx === -1) return null;
  return decodeShare(window.location.hash.slice(idx + SHARE_HASH_PREFIX.length));
}

type Specimen =
  | 'onion' | 'cheek' | 'bacteria' | 'blood' | 'mitosis'
  | 'paramecium' | 'amoeba' | 'elodea' | 'spirogyra' | 'volvox'
  | 'diatom' | 'yeast' | 'fungal' | 'pollen' | 'cork' | 'xylem'
  | 'muscle' | 'nerve' | 'frogblood' | 'fishscale'
  | 'hydra' | 'planaria' | 'intestine' | 'liver' | 'tardigrade';
type Objective = '4x' | '10x' | '40x' | '100x';
type Stain = 'none' | 'iodine' | 'methylene' | 'eosin';
type Eyepiece = 'WF10x' | 'WF15x';

const OBJECTIVES: { id: Objective; mag: number; color: string; na: string }[] = [
  { id: '4x',   mag: 40,   color: '#C47B6B', na: '0.10' },
  { id: '10x',  mag: 100,  color: '#B89555', na: '0.25' },
  { id: '40x',  mag: 400,  color: '#6A9B7A', na: '0.65' },
  { id: '100x', mag: 1000, color: '#5B7FA5', na: '1.25' },
];

const SPECIMENS: { id: Specimen; label: string; desc: string; domain: string; wall: string; size: string; group: string }[] = [
  { id: 'onion',    label: 'Onion Epidermis',    desc: 'Large rectangular cells with visible cell walls and central vacuole', domain: 'Eukaryote', wall: 'Yes (cellulose)', size: '~50–100 µm', group: 'Plants' },
  { id: 'elodea',   label: 'Elodea Leaf',        desc: 'Aquatic plant leaf — green chloroplasts stream around the cell edges', domain: 'Eukaryote', wall: 'Yes (cellulose)', size: '~60–120 µm cells', group: 'Plants' },
  { id: 'spirogyra',label: 'Spirogyra',          desc: 'Filamentous green algae with beautiful spiral ribbon chloroplasts', domain: 'Eukaryote', wall: 'Yes (cellulose)', size: '~50–100 µm cells', group: 'Plants' },
  { id: 'pollen',   label: 'Pollen Grains',      desc: 'Sperm-producing grains with textured outer walls (exine) and pores', domain: 'Eukaryote', wall: 'Yes (sporopollenin)', size: '~10–100 µm', group: 'Plants' },
  { id: 'cork',     label: 'Cork Cells',         desc: 'Empty dead cells with thick suberized walls — the original cells Hooke described', domain: 'Eukaryote', wall: 'Yes (suberin)', size: '~20–50 µm', group: 'Plants' },
  { id: 'xylem',    label: 'Xylem Vessels',      desc: 'Lignified water-conducting tubes with spiral and ring thickenings', domain: 'Eukaryote', wall: 'Yes (lignin)', size: '~20–60 µm wide', group: 'Plants' },
  { id: 'cheek',    label: 'Human Cheek Cells',  desc: 'Irregular squamous epithelial cells with a large central nucleus', domain: 'Eukaryote', wall: 'None', size: '~60–80 µm', group: 'Animals' },
  { id: 'muscle',   label: 'Skeletal Muscle',    desc: 'Long striated muscle fibers with visible banding and many nuclei', domain: 'Eukaryote', wall: 'None', size: '~50–100 µm fibers', group: 'Animals' },
  { id: 'nerve',    label: 'Nerve Cells',        desc: 'Neurons with branching dendrites and a long axon for signal transmission', domain: 'Eukaryote', wall: 'None', size: '~10 µm soma; long axon', group: 'Animals' },
  { id: 'blood',    label: 'Blood Smear',        desc: 'Biconcave RBCs, white blood cells, and platelets visible at high magnification', domain: 'Eukaryote', wall: 'None', size: '6–8 µm (RBC)', group: 'Animals' },
  { id: 'frogblood',label: 'Frog Blood',         desc: 'Nucleated oval red blood cells — typical of non-mammalian vertebrates', domain: 'Eukaryote', wall: 'None', size: '~22 µm RBC', group: 'Animals' },
  { id: 'fishscale',label: 'Fish Scale',         desc: 'Rounded overlapping scales with concentric growth rings (circuli)', domain: 'Eukaryote', wall: 'None (dermal bone)', size: '~2–10 mm', group: 'Animals' },
  { id: 'hydra',    label: 'Hydra',              desc: 'Freshwater cnidarian with tentacles armed with stinging cells', domain: 'Eukaryote', wall: 'None', size: '~1–5 mm', group: 'Animals' },
  { id: 'planaria', label: 'Planaria',           desc: 'Freshwater flatworm with distinctive eye spots and bilateral symmetry', domain: 'Eukaryote', wall: 'None', size: '~3–15 mm', group: 'Animals' },
  { id: 'intestine',label: 'Intestinal Villi',   desc: 'Finger-like projections of the small intestine lining that absorb nutrients', domain: 'Eukaryote', wall: 'None', size: '~0.5–1 mm villi', group: 'Animals' },
  { id: 'liver',    label: 'Liver Tissue',       desc: 'Polygonal hepatocytes clustered around narrow blood channels (sinusoids)', domain: 'Eukaryote', wall: 'None', size: '~20–30 µm hepatocytes', group: 'Animals' },
  { id: 'tardigrade',label: 'Tardigrade',        desc: 'Water bear — eight-legged micro-animal famous for surviving extreme conditions', domain: 'Eukaryote', wall: 'None (cuticle)', size: '~200–500 µm', group: 'Animals' },
  { id: 'amoeba',   label: 'Amoeba proteus',     desc: 'Irregular shape with flowing pseudopods for movement and phagocytosis', domain: 'Eukaryote', wall: 'None', size: '~300–500 µm', group: 'Protists' },
  { id: 'paramecium', label: 'Paramecium',     desc: 'Freshwater ciliate with hair-like cilia and a clear macronucleus', domain: 'Eukaryote', wall: 'None', size: '~50–300 µm', group: 'Protists' },
  { id: 'volvox',   label: 'Volvox',              desc: 'Colonial green algae — a hollow sphere of thousands of cells with daughter colonies', domain: 'Eukaryote', wall: 'Yes (cellulose)', size: '~300–500 µm colony', group: 'Protists' },
  { id: 'diatom',   label: 'Diatoms',             desc: 'Single-celled algae with beautiful transparent silica (glass) frustule shells', domain: 'Eukaryote', wall: 'Yes (silica frustule)', size: '~20–200 µm', group: 'Protists' },
  { id: 'yeast',    label: 'Yeast Cells',         desc: 'Budding fungus — single cells reproducing asexually by budding', domain: 'Eukaryote', wall: 'Yes (chitin)', size: '~3–5 µm', group: 'Fungi' },
  { id: 'fungal',   label: 'Fungal Hyphae',       desc: 'Filamentous fungal network (mycelium) with cross-walls and spores', domain: 'Eukaryote', wall: 'Yes (chitin)', size: '~5–10 µm wide', group: 'Fungi' },
];

// Per-specimen tint/base colors used for UI dots and un-stained field backgrounds.
const TINT_COLORS: Record<Specimen, string> = {
  onion: '#c8956c', elodea: '#4f9e52', spirogyra: '#3f9142', pollen: '#c9972f', cork: '#a97d3f',
  xylem: '#b08a4f', cheek: '#e8b4a0', muscle: '#d98a8a', nerve: '#7d6ba5', fishscale: '#7fa8b0',
  hydra: '#5a9e92', planaria: '#a08555', intestine: '#e08a8a', liver: '#c08060', tardigrade: '#7a9aa8',
  amoeba: '#6f9db0', paramecium: '#5a9898', volvox: '#4f9e52', diatom: '#c8a45a', yeast: '#d9bc70',
  fungal: '#c9b37a', bacteria: '#7ec8c8', blood: '#C47B6B', frogblood: '#f0a8a0', mitosis: '#66bb6a',
};

const STAINS: { id: Stain; label: string; color: string; targets: string }[] = [
  { id: 'none',      label: 'No Stain',       color: 'transparent', targets: 'Natural color' },
  { id: 'iodine',    label: 'Iodine (Lugol)',  color: '#b45309',     targets: 'Starch — turns blue/black; cytoplasm yellow-brown' },
  { id: 'methylene', label: 'Methylene Blue',  color: '#1d4ed8',     targets: 'Nucleus and DNA — deep blue' },
  { id: 'eosin',     label: 'Eosin Y',         color: '#C47B6B',     targets: 'Cytoplasm and proteins — pink' },
];

const PERFECT = 65;

function SpecimenSVG({ specimen, zoom, blur, brightness, stain, offsetX, offsetY }: {
  specimen: Specimen; zoom: number; blur: number; brightness: number; stain: Stain; offsetX: number; offsetY: number;
}) {
  const stainObj = STAINS.find(s => s.id === stain)!;
  const tint = stain !== 'none' ? stainObj.color : null;

  return (
    <g style={{ filter: `blur(${blur}px) brightness(${brightness}) contrast(1.18) saturate(0.92)` }}>
      <g transform={`translate(${offsetX}, ${offsetY}) scale(${zoom})`}>
        <g filter="url(#microscopy)">
      {specimen === 'onion' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint === '#b45309' ? '#f1e2b8' : tint === '#1d4ed8' ? '#dce9fb' : tint === '#C47B6B' ? '#f7e6e2' : '#f3e8cd'} />
          <g transform="translate(0,0)">
            {[
              {x:-100,y:-95,w:72,h:48},{x:-22,y:-92,w:76,h:52},{x:56,y:-96,w:68,h:46},{x:130,y:-90,w:74,h:50},
              {x:-104,y:-32,w:70,h:54},{x:-20,y:-34,w:74,h:50},{x:58,y:-30,w:72,h:54},{x:128,y:-34,w:66,h:52},
              {x:-98,y:30,w:74,h:52},{x:-18,y:32,w:68,h:54},{x:60,y:28,w:76,h:50},{x:126,y:32,w:70,h:54},
              {x:-100,y:94,w:70,h:50},{x:-20,y:96,w:74,h:48},{x:58,y:92,w:68,h:52},{x:128,y:96,w:72,h:50},
            ].map((c, i) => (
              <g key={i} transform={`translate(${c.x + (i % 4) * 3 - 4},${c.y + ((i * 7) % 5) - 2})`}>
                <rect x="0" y="0" width={c.w} height={c.h} rx="3" fill={tint === '#b45309' ? 'url(#cytoIod)' : tint === '#1d4ed8' ? 'url(#cytoBlue)' : tint === '#C47B6B' ? 'url(#cytoPink)' : 'url(#cyto)'} filter="url(#cytoTex)" opacity="0.96"/>
                <rect x="0" y="0" width={c.w} height={c.h} rx="3" fill="none" stroke={tint ? tint : '#b98a54'} strokeWidth="3" opacity="0.95"/>
                <rect x="2" y="2" width={c.w-4} height={c.h-4} rx="2" fill="none" stroke={tint ? tint : '#d4a878'} strokeWidth="1" opacity="0.8"/>
                <rect x="4" y="0" width="1.5" height={c.h} fill={tint ? tint : '#c8956c'} opacity="0.45"/>
                <ellipse cx={c.w/2} cy={c.h/2} rx={c.w*0.32} ry={c.h*0.28} fill="rgba(255,255,255,0.5)" stroke={tint ? tint : '#d9b98e'} strokeWidth="0.8" opacity="0.85"/>
                <ellipse cx={c.w/2} cy={c.h/2} rx={c.w*0.16} ry={c.h*0.15} fill={tint === '#1d4ed8' ? 'url(#nucleusBlue)' : 'url(#nucleus)'} opacity={stain !== 'none' ? 0.95 : 0.6}/>
                <ellipse cx={c.w/2 + 2} cy={c.h/2 - 1} rx={c.w*0.055} ry={c.h*0.05} fill={tint === '#1d4ed8' ? '#7ea6f0' : '#7a5436'} opacity="0.9"/>
                <circle cx={c.w/2 - 4} cy={c.h/2 - 3} r="1.1" fill={tint === '#1d4ed8' ? '#9dbdf5' : '#4a2c16'} opacity="0.85"/>
                <circle cx={c.w/2 + 3} cy={c.h/2 + 3} r="0.9" fill={tint === '#1d4ed8' ? '#9dbdf5' : '#4a2c16'} opacity="0.75"/>
              </g>
            ))}
          </g>
        </g>
      )}
      {specimen === 'cheek' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint === '#1d4ed8' ? '#e2edfc' : tint ? '#fbeff2' : '#f9f0ea'} />
          {[[50,50,0],[130,40,25],[80,120,15],[160,110,-20],[30,150,30],[145,170,-10],[95,55,40],[60,100,-15],[-20,70,-30],[180,150,10]].map(([cx,cy,rot],i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`}>
              <ellipse cx="0" cy="0" rx="34" ry="23" fill={tint === '#1d4ed8' ? 'url(#cytoBlue)' : 'url(#cytoPink)'} filter="url(#cytoTex)" opacity="0.92"/>
              <ellipse cx="0" cy="0" rx="34" ry="23" fill="none" stroke={tint ? tint : '#d18a74'} strokeWidth="2" opacity="0.95"/>
              <ellipse cx="0" cy="0" rx="11" ry="8" fill={tint === '#1d4ed8' ? 'url(#nucleusBlue)' : 'url(#nucleus)'} opacity={stain !== 'none' ? 0.95 : 0.6}/>
              <ellipse cx="1" cy="-1" rx="3.5" ry="2.4" fill={tint === '#1d4ed8' ? '#7ea6f0' : '#7a4a36'} opacity="0.9"/>
            </g>
          ))}
        </g>
      )}
      {specimen === 'bacteria' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint === '#1d4ed8' ? '#dcecf4' : tint ? '#dcecf0' : '#e4f1f3'} />
          {[[60,40],[75,50],[68,60],[150,45],[162,56],[155,68],[28,120],[40,110],[32,132]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill={tint ? tint : '#4a8088'} opacity="0.85"/>
          ))}
          {Array.from({length:28},(_, i) => {
            const x = ((i * 47 + 12) % 360) - 150;
            const y = ((i * 63 + 18) % 300) - 110;
            const angle = (i * 37) % 180;
            return (
              <g key={i} transform={`translate(${x},${y}) rotate(${angle})`}>
                <rect x="-13" y="-5" width="26" height="10" rx="5" fill={tint ? tint : '#4a8088'} opacity="0.9"/>
                <ellipse cx="-13" cy="0" r="5" fill={tint ? tint : '#3c6d74'} opacity="0.8"/>
                <ellipse cx="13" cy="0" r="5" fill={tint ? tint : '#3c6d74'} opacity="0.8"/>
                <ellipse cx="-3" cy="-1.5" rx="4" ry="2" fill={tint === '#1d4ed8' ? '#6f8fe0' : 'rgba(255,255,255,0.5)'} opacity="0.7"/>
              </g>
            );
          })}
        </g>
      )}
      {specimen === 'blood' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint === '#C47B6B' ? '#fbeef2' : '#faf4f0'} />
          {[[40,40],[100,35],[165,50],[55,100],[120,95],[185,90],[30,155],[100,150],[170,145],[70,70],[145,75],[10,110],[200,135],[65,185],[150,185],[90,20],[200,25],[15,60],[180,170],[110,180],[35,20],[215,105]].map(([cx,cy],i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${i*23})`}>
              <ellipse cx="0" cy="0" rx="17" ry="11.5" fill={tint === '#C47B6B' ? 'url(#rbcStain)' : 'url(#rbc)'} />
              <ellipse cx="0" cy="0" rx="17" ry="11.5" fill="none" stroke="rgba(140,40,35,0.4)" strokeWidth="0.7"/>
              <ellipse cx="0" cy="0" rx="7" ry="4.5" fill={tint === '#C47B6B' ? 'rgba(248,190,214,0.8)' : 'rgba(226,175,163,0.75)'} opacity="0.8"/>
              <ellipse cx="-4" cy="-3" rx="5" ry="2.5" fill="rgba(255,255,255,0.18)"/>
            </g>
          ))}
          {[[115,75],[62,138]].map(([sx,sy],j) => (
            <g key={j} transform={`translate(${sx},${sy}) rotate(${j*7})`}>
              <ellipse cx="0" cy="-12" rx="16" ry="10.5" fill={tint === '#C47B6B' ? 'url(#rbcStain)' : 'url(#rbc)'} opacity="0.9"/>
              <ellipse cx="0" cy="0" rx="16" ry="10.5" fill={tint === '#C47B6B' ? 'url(#rbcStain)' : 'url(#rbc)'} opacity="0.95"/>
              <ellipse cx="0" cy="12" rx="16" ry="10.5" fill={tint === '#C47B6B' ? 'url(#rbcStain)' : 'url(#rbc)'} opacity="0.9"/>
            </g>
          ))}
          <g transform="translate(130,60)">
            <ellipse cx="0" cy="0" rx="23" ry="19" fill={tint === '#1d4ed8' ? 'url(#wbcBlue)' : 'url(#wbc)'} filter="url(#cytoTex)" stroke="rgba(120,110,180,0.6)" strokeWidth="1"/>
            <path d="M-8 -6 Q 0 -12 8 -6 Q 12 0 7 6 Q 0 10 -7 6 Q -12 0 -8 -6 Z" fill={tint === '#1d4ed8' ? 'url(#nucleusBlue)' : 'url(#nucleusPurple)'} opacity="0.9"/>
            <text x="0" y="3" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="bold">WBC</text>
          </g>
          <g transform="translate(45,168)">
            <ellipse cx="0" cy="0" rx="17" ry="14" fill={tint === '#1d4ed8' ? 'url(#wbcBlue)' : 'url(#wbc)'} filter="url(#cytoTex)" opacity="0.9"/>
            <circle cx="-2" cy="-1" r="4.5" fill={tint === '#1d4ed8' ? 'url(#nucleusBlue)' : 'url(#nucleusPurple)'} opacity="0.9"/>
            <circle cx="3" cy="2" r="3" fill={tint === '#1d4ed8' ? 'url(#nucleusBlue)' : 'url(#nucleusPurple)'} opacity="0.9"/>
          </g>
          <g transform="translate(150,130)">
            <circle cx="0" cy="0" r="4" fill="#d98ca0" opacity="0.8"/>
            <circle cx="0" cy="0" r="1.6" fill="#a85a72"/>
          </g>
          <g transform="translate(75,45)">
            <circle cx="0" cy="0" r="3.4" fill="#d98ca0" opacity="0.75"/>
            <circle cx="0" cy="0" r="1.3" fill="#a85a72"/>
          </g>
        </g>
      )}
      {specimen === 'mitosis' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#edf2e4' : '#f0f4e6'} />
          {[
            {x:30, y:30, stage:'Interphase', chromosomes:[[0,-14],[6,-12],[-6,-12],[0,-8],[4,-6],[-4,-6]], meta:false},
            {x:120, y:35, stage:'Prophase', chromosomes:[[0,-16],[8,-10],[-8,-10],[0,-4],[6,2],[-6,2]], meta:false},
            {x:55, y:115, stage:'Metaphase', chromosomes:[[-10,-8],[-4,-6],[2,-6],[8,-8],[-8,4],[-2,6],[4,6],[10,4]], meta:true},
            {x:145, y:110, stage:'Anaphase', chromosomes:[[0,-18],[6,-14],[-6,-14],[0,12],[6,16],[-6,16]], meta:false},
            {x:85, y:50, stage:'Telophase', chromosomes:[[0,-10],[5,-7],[-5,-7]], meta:false},
          ].map((cell, ci) => (
            <g key={ci} transform={`translate(${cell.x},${cell.y})`}>
              <ellipse cx="0" cy="0" rx="38" ry="30" fill={tint === '#1d4ed8' ? 'url(#cytoBlue)' : tint === '#C47B6B' ? 'url(#cytoPink)' : 'url(#cytoGreen)'} stroke={tint ? tint : '#5f9e5a'} strokeWidth="1.5" opacity="0.95"/>
              {!cell.meta && <ellipse cx="0" cy="0" rx="16" ry="13" fill="none" stroke={tint === '#1d4ed8' ? '#5f8fe0' : '#3c7d3a'} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6"/>}
              {cell.chromosomes.map(([cx,cy], i) => (
                <g key={i} transform={`rotate(${cell.meta ? 90 : 0} ${cx} ${cy})`}>
                  <ellipse cx={cx} cy={cy} rx="4" ry="2.2" fill={tint === '#1d4ed8' ? '#6f8fe0' : tint === '#C47B6B' ? '#d97a8a' : '#2e6a2c'} opacity="0.95"/>
                  <ellipse cx={cx} cy={cy - 0.7} rx="3" ry="1" fill="rgba(255,255,255,0.3)" opacity="0.7"/>
                </g>
              ))}
              {cell.meta && <line x1="0" y1="-26" x2="0" y2="26" stroke={tint === '#1d4ed8' ? '#5f8fe0' : '#8a6a3a'} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.7"/>}
              <text x="0" y="27" textAnchor="middle" fontSize="7" fill={tint ? tint : '#2e5a2c'} fontWeight="600">{cell.stage}</text>
            </g>
          ))}
        </g>
      )}
      {specimen === 'elodea' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#dff0df' : '#e6f4e4'} />
          <g transform="translate(-110,-155)">
            {[
              {x:0,y:0},{x:110,y:0},{x:0,y:160},{x:110,y:160},
            ].map((c,i) => (
              <g key={i}>
                <rect x={c.x} y={c.y} width="100" height="150" rx="6" fill={tint === '#1d4ed8' ? '#dbeafe' : '#d8edd6'} filter="url(#cytoTex)" stroke="#3f9142" strokeWidth="2.5" />
                <rect x={c.x+8} y={c.y+8} width="84" height="134" rx="4" fill={tint ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)'} stroke={tint ? tint : '#4f9e52'} strokeWidth="1.5" />
                <ellipse cx={c.x+50} cy={c.y+75} rx="24" ry="16" fill={tint === '#1d4ed8' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.5)'} stroke={tint ? tint : '#7fb87f'} strokeWidth="1" />
                {Array.from({length: 24}, (_, j) => {
                  const px = c.x + 6 + (j % 6) * 16 + (Math.floor(j/6)%2)*6;
                  const py = c.y + 6 + Math.floor(j / 6) * 28;
                  return <ellipse key={j} cx={px} cy={py} rx="3" ry="2.2" fill={tint ? tint : '#2f7d33'} opacity="0.95"/>;
                })}
                {Array.from({length: 5}, (_, j) => (
                  <circle key={j} cx={c.x + 18 + j*14} cy={c.y + 40 + (j%2)*18} r="1.4" fill={tint ? tint : '#3f9142'} opacity="0.6"/>
                ))}
              </g>
            ))}
          </g>
        </g>
      )}
      {specimen === 'spirogyra' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e8f6e4' : '#eef9ea'} />
          <g transform="translate(-153,-110)">
            {[0, 140].map((dy, row) => (
              <g key={row} transform={`translate(${row ? -45 : 0},${dy})`}>
                {[0, 62, 124, 186, 248].map((dx, ci) => (
                  <g key={ci} transform={`translate(${dx},0)`}>
                    <rect x="0" y="0" width="58" height="80" rx="3" fill={tint ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.7)'} stroke={tint ? tint : '#3f9142'} strokeWidth="2" filter="url(#cytoTex)"/>
                    <path d="M6 8 L28 30 L10 42 L32 66" fill="none" stroke={tint ? tint : '#2f7d33'} strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
                    <path d="M52 8 L30 30 L48 42 L26 66" fill="none" stroke={tint ? tint : '#2f7d33'} strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
                    <ellipse cx="29" cy="40" rx="5" ry="7" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#1b5e20'} opacity="0.85"/>
                  </g>
                ))}
              </g>
            ))}
          </g>
        </g>
      )}
      {specimen === 'pollen' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#fdf3dc' : '#fdf6e4'} />
          <g transform="translate(-97,-110)">
          {[
            {cx: 55, cy: 60, r: 34},
            {cx: 140, cy: 90, r: 46},
            {cx: 95, cy: 160, r: 40},
          ].map((gr, i) => (
            <g key={i}>
              <circle cx={gr.cx} cy={gr.cy} r={gr.r} fill={tint ? tint : '#c9972f'} filter="url(#cytoTex)" opacity="0.85" />
              <circle cx={gr.cx} cy={gr.cy} r={gr.r} fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#8a6318'} strokeWidth="2.5" strokeDasharray="6 5" opacity="0.7" />
              <circle cx={gr.cx} cy={gr.cy} r={gr.r * 0.75} fill="none" stroke={tint ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" />
              {Array.from({length: 8}, (_, j) => {
                const a = (j / 8) * Math.PI * 2;
                const px = gr.cx + Math.cos(a) * gr.r * 0.55;
                const py = gr.cy + Math.sin(a) * gr.r * 0.55;
                return <circle key={j} cx={px} cy={py} r="3.5" fill={tint === '#1d4ed8' ? '#1e40af' : '#7a5a14'} />;
              })}
              <ellipse cx={gr.cx} cy={gr.cy - gr.r * 0.3} rx={gr.r * 0.35} ry={gr.r * 0.2} fill="rgba(255,255,255,0.25)" />
            </g>
          ))}
          </g>
        </g>
      )}
      {specimen === 'cork' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f0e2c8' : '#f4e8d0'} />
          <g transform="translate(-95,-105)">
            {Array.from({length: 5 * 5}, (_, i) => {
              const col = i % 5, row = Math.floor(i / 5);
              const x = col * 38 + (row % 2 ? 19 : 0);
              const y = row * 42;
              return (
                <g key={i}>
                  <rect x={x} y={y} width="34" height="34" rx="8" fill={tint === '#1d4ed8' ? '#dbeafe' : '#e7d3ad'} stroke={tint ? tint : '#a97d3f'} strokeWidth="3" opacity="0.9" />
                  <rect x={x + 7} y={y + 7} width="20" height="20" rx="5" fill="none" stroke={tint ? tint : '#a97d3f'} strokeWidth="1" opacity="0.4" />
                </g>
              );
            })}
          </g>
        </g>
      )}
      {specimen === 'xylem' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f3e9d6' : '#f7efdf'} />
          <g transform="translate(-93,-100)">
            {[0, 62, 124].map((dx, ci) => (
              <g key={ci} transform={`translate(${dx},0)`}>
                <rect x="0" y="0" width="52" height="200" rx="10" fill={tint ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.6)'} stroke={tint ? tint : '#b08a4f'} strokeWidth="2.5" />
                {ci === 0 && <path d="M6 10 Q26 30 6 50 Q26 70 6 90 Q26 110 6 130 Q26 150 6 170 Q26 190 6 205" fill="none" stroke={tint ? tint : '#8a642f'} strokeWidth="5" opacity="0.85"/>}
                {ci === 1 && <path d="M46 10 Q26 30 46 50 Q26 70 46 90 Q26 110 46 130 Q26 150 46 170 Q26 190 46 205" fill="none" stroke={tint ? tint : '#8a642f'} strokeWidth="5" opacity="0.85"/>}
                {ci === 2 && [20, 60, 100, 140, 180].map((ry, j) => (
                  <path key={j} d={`M8 ${ry} h36`} fill="none" stroke={tint ? tint : '#8a642f'} strokeWidth="5" opacity="0.8"/>
                ))}
              </g>
            ))}
          </g>
        </g>
      )}
      {specimen === 'muscle' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#fbe7e7' : '#fdeaea'} />
          <g transform="translate(-45,-95)">
            {Array.from({length:12},(_, fi) => {
              const dx = -170 + fi * 30;
              return (
                <g key={fi} transform={`translate(${dx},0)`}>
                  <rect x="0" y="0" width="22" height="200" rx="6" fill={tint ? tint : '#d98a8a'} filter="url(#cytoTex)" opacity="0.85"/>
                  {Array.from({length: 20}, (_, j) => (
                    <rect key={j} x="0" y={j * 10} width="22" height="4.5" fill={tint === '#1d4ed8' ? '#1e40af' : '#b0563f'} opacity={tint ? 0.75 : 0.65}/>
                  ))}
                  {[30, 90, 150].map((ny, k) => (
                    <ellipse key={k} cx="11" cy={ny} rx="5.5" ry="3.5" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#7a2a1e'} opacity="0.9"/>
                  ))}
                </g>
              );
            })}
          </g>
        </g>
      )}
      {specimen === 'nerve' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#efe9f7' : '#f2ecf8'} />
          <g>
            {[
              {x:50,y:-12,s:1,a:0},
              {x:-95,y:-85,s:0.7,a:180},
              {x:108,y:92,s:0.6,a:40},
            ].map((n,i) => (
              <g key={i} transform={`translate(${n.x},${n.y}) rotate(${n.a}) scale(${n.s})`}>
                <circle cx="0" cy="0" r="16" fill={tint ? tint : '#7d6ba5'} filter="url(#cytoTex)" opacity="0.85"/>
                <circle cx="0" cy="0" r="9" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#4a3a75'} opacity="0.85"/>
                <circle cx="0" cy="0" r="4" fill={tint === '#1d4ed8' ? '#1e40af' : '#2c2150'} opacity="0.9"/>
                {[
                  [-20, -14], [-34, -30], [-46, -48], [-60, -60],
                  [8, -18], [20, -32], [34, -42],
                  [-14, 16], [-26, 32], [-40, 42],
                  [14, 16], [28, 30], [44, 40],
                ].map(([x, y], j) => (
                  <line key={j} x1="0" y1="0" x2={x} y2={y} stroke={tint ? tint : '#7d6ba5'} strokeWidth="2" opacity="0.8"/>
                ))}
                {[
                  [-20, -14], [-34, -30], [-46, -48], [-60, -60],
                  [8, -18], [20, -32], [34, -42],
                  [-14, 16], [-26, 32], [-40, 42],
                  [14, 16], [28, 30], [44, 40],
                ].map(([x, y], j) => (
                  <circle key={j} cx={x} cy={y} r="2.5" fill={tint ? tint : '#7d6ba5'} opacity="0.9"/>
                ))}
                <line x1="0" y1="0" x2="-30" y2="18" stroke={tint ? tint : '#7d6ba5'} strokeWidth="4" strokeLinecap="round" opacity="0.85"/>
                <line x1="-30" y1="18" x2="-85" y2="95" stroke={tint ? tint : '#7d6ba5'} strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
              </g>
            ))}
          </g>
        </g>
      )}
      {specimen === 'frogblood' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint === '#C47B6B' ? '#fff0f4' : '#fff7f4'} />
          <g transform="translate(-112,-102)">
          {[[45,45,-15],[105,35,10],[165,50,-5],[60,100,20],[125,95,-20],[185,90,15],[40,160,-10],[100,155,5],[165,145,25],[80,60,40]].map(([cx,cy,rot],i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`}>
              <ellipse cx="0" cy="0" rx="24" ry="14" fill={tint === '#C47B6B' ? '#f9a8d4' : '#f0a8a0'} stroke="#c97a72" strokeWidth="1.2" opacity="0.9"/>
              <ellipse cx="0" cy="0" rx="9" ry="7" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#8a2a2a'} opacity="0.9"/>
              <ellipse cx="0" cy="0" rx="4.5" ry="3.5" fill={tint === '#1d4ed8' ? '#1e40af' : '#5e1a1a'} opacity="0.9"/>
            </g>
          ))}
          </g>
        </g>
      )}
      {specimen === 'fishscale' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e6f0f2' : '#edf5f6'} />
          <g transform="translate(-87,-117)">
          {[[50,40],[125,90],[45,130],[130,20],[70,190]].map(([cx,cy],i) => (
            <g key={i}>
              <path d={`M ${cx-35} ${cy} A 35 45 0 0 1 ${cx+35} ${cy} Z`} fill={tint ? tint : '#8fb0b8'} opacity="0.85"/>
              {[12, 22, 32].map((r, j) => (
                <path key={j} d={`M ${cx-r} ${cy} A ${r} ${r*1.3} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#4f7680'} strokeWidth="1.5" opacity="0.8"/>
              ))}
            </g>
          ))}
          </g>
        </g>
      )}
      {specimen === 'hydra' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e6f5f1' : '#eef8f5'} />
          <g transform="translate(0,-35)">
            <path d="M0 -70 Q -18 -50 -16 -20 L -16 90 Q 0 110 16 90 L 16 -20 Q 18 -50 0 -70 Z" fill={tint ? tint : '#5a9e92'} filter="url(#cytoTex)" opacity="0.9"/>
            {[[-55,-75],[-30,-95],[-10,-100],[5,-100],[30,-95],[55,-75],[-70,-55],[70,-55]].map(([tx,ty],i) => (
              <path key={i} d={`M0 -70 Q ${tx*0.5} ${ty*0.7} ${tx} ${ty}`} fill="none" stroke={tint ? tint : '#4f8a80'} strokeWidth="4" strokeLinecap="round" opacity="0.85"/>
            ))}
            {[[-55,-75],[-30,-95],[-10,-100],[5,-100],[30,-95],[55,-75]].map(([tx,ty],i) => (
              <circle key={i} cx={tx} cy={ty} r="3" fill={tint ? tint : '#3c6f66'} />
            ))}
          </g>
        </g>
      )}
      {specimen === 'planaria' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f0ead8' : '#f5efdf'} />
          <g transform="translate(0,0)">
            <path d="M0 -90 Q 12 -80 14 -20 L 12 80 Q 0 95 -12 80 L -14 -20 Q -12 -80 0 -90 Z" fill={tint ? tint : '#a08555'} opacity="0.9"/>
            <circle cx="-6" cy="-55" r="4" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#2c2010'} />
            <circle cx="6" cy="-55" r="4" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#2c2010'} />
            <path d="M0 -30 L 5 0 L -4 25" fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#6f5a34'} strokeWidth="2.5" opacity="0.8"/>
            <path d="M0 -30 L -6 5 L 5 30" fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#6f5a34'} strokeWidth="2.5" opacity="0.8"/>
            <path d="M0 0 L 3 40" fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#6f5a34'} strokeWidth="2.5" opacity="0.8"/>
          </g>
        </g>
      )}
      {specimen === 'intestine' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#fbe9e7' : '#fdecea'} />
          <g transform="translate(-70,105)">
            <rect x="0" y="0" width="170" height="8" rx="3" fill={tint ? tint : '#e08a8a'} />
            {Array.from({length: 12}, (_, i) => {
              const x = 10 + i * 14;
              const h = 90 + (i % 3) * 25;
              return (
                <g key={i}>
                  <path d={`M ${x-4} 6 Q ${x-6} ${-h*0.6} ${x-2} ${-h} Q ${x+2} ${-h} ${x+4} ${-h*0.6} Q ${x+6} ${-h*0.4} ${x+5} 6 Z`} fill={tint ? tint : '#e8a0a0'} opacity="0.85"/>
                  <line x1={x} y1="6" x2={x} y2={-h+8} stroke={tint === '#1d4ed8' ? '#1e40af' : '#c96a6a'} strokeWidth="1.5" opacity="0.6"/>
                </g>
              );
            })}
            {Array.from({length: 30}, (_, i) => (
              <circle key={i} cx={6 + (i % 15) * 11} cy={10 + Math.floor(i / 15) * 80} r="2" fill={tint === '#1d4ed8' ? '#93c5fd' : '#c96a6a'} opacity="0.7"/>
            ))}
          </g>
        </g>
      )}
      {specimen === 'liver' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f7e9df' : '#faece3'} />
          <g transform="translate(-100,-105)">
            {Array.from({length: 6 * 5}, (_, i) => {
              const col = i % 6, row = Math.floor(i / 6);
              const cx = col * 34 + 17, cy = row * 42 + 21;
              return (
                <g key={i}>
                  <polygon points={`${cx},${cy-16} ${cx+14},${cy-8} ${cx+14},${cy+8} ${cx},${cy+16} ${cx-14},${cy+8} ${cx-14},${cy-8}`} fill={tint ? tint : '#c08060'} filter="url(#cytoTex)" opacity="0.85" stroke="#a56240" strokeWidth="1"/>
                  <circle cx={cx} cy={cy} r="5" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#7a3a1e'} opacity="0.85"/>
                  <circle cx={cx-1.5} cy={cy-1.5} r="1" fill={tint === '#1d4ed8' ? '#9dbdf5' : '#4a1e10'} opacity="0.8"/>
                </g>
              );
            })}
            {Array.from({length: 5}, (_, i) => (
              <path key={i} d={`M ${-68 + i*34} 12 C ${-46 + i*34} 44 ${-58 + i*34} 82 ${-38 + i*34} 116 C ${-18 + i*34} 148 ${-34 + i*34} 180 ${-20 + i*34} 208`} fill="none" stroke={tint === '#1d4ed8' ? '#60a5fa' : '#a56240'} strokeWidth="3" opacity="0.5"/>
            ))}
          </g>
        </g>
      )}
      {specimen === 'tardigrade' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e6f0f4' : '#edf4f7'} />
          <g transform="translate(50,0)">
            <ellipse cx="0" cy="40" rx="22" ry="34" fill={tint ? tint : '#7a9aa8'} filter="url(#cytoTex)" opacity="0.9"/>
            <ellipse cx="0" cy="45" rx="13" ry="20" fill="none" stroke={tint ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)'} strokeWidth="2" opacity="0.6"/>
            {[[-18,25],[-16,45],[-16,65],[18,25],[16,45],[16,65]].map(([lx,ly],i) => (
              <line key={i} x1={lx} y1={ly} x2={lx*1.8} y2={ly+18} stroke={tint ? tint : '#5f7f8d'} strokeWidth="4" strokeLinecap="round"/>
            ))}
            {[[-32,43],[-29,63],[-29,83],[32,43],[29,63],[29,83]].map(([lx,ly],i) => (
              <circle key={i} cx={lx} cy={ly} r="3" fill={tint === '#1d4ed8' ? '#1e40af' : '#4a6670'} />
            ))}
            <circle cx="-4" cy="6" r="7" fill={tint ? tint : '#8aa8b5'} />
            <circle cx="4" cy="6" r="7" fill={tint ? tint : '#8aa8b5'} />
            <circle cx="-3" cy="5" r="2.5" fill="#20242a" />
            <circle cx="5" cy="5" r="2.5" fill="#20242a" />
            <circle cx="0" cy="0" r="3.5" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#2c3a42'} />
          </g>
        </g>
      )}
      {specimen === 'amoeba' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e3f0f6' : '#ecf5f9'} />
          <g transform="translate(98,112)">
            <path d="M-70 -20 Q-45 -70 -10 -55 Q20 -90 60 -50 Q85 -30 55 -5 Q70 25 40 45 Q20 75 -15 65 Q-40 85 -60 55 Q-80 30 -70 -20 Z" fill={tint ? tint : '#6f9db0'} filter="url(#cytoTex)" opacity="0.85"/>
            <path d="M-70 -20 Q-45 -70 -10 -55 Q20 -90 60 -50 Q85 -30 55 -5 Q70 25 40 45 Q20 75 -15 65 Q-40 85 -60 55 Q-80 30 -70 -20 Z" fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#4a7488'} strokeWidth="2"/>
            <circle cx="-8" cy="-5" r="12" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#3c5c70'} opacity="0.9"/>
            <circle cx="-8" cy="-5" r="5.5" fill={tint === '#1d4ed8' ? '#1e40af' : '#243c4c'} opacity="0.9"/>
            <circle cx="25" cy="20" r="9" fill={tint === '#1d4ed8' ? '#93c5fd' : '#8fb8cc'} stroke={tint === '#1d4ed8' ? '#1e40af' : '#4a7488'} strokeWidth="1.5"/>
            <circle cx="-35" cy="25" r="7" fill={tint === '#1d4ed8' ? '#93c5fd' : '#8fb8cc'} stroke={tint === '#1d4ed8' ? '#1e40af' : '#4a7488'} strokeWidth="1.5"/>
            <circle cx="-38" cy="-28" r="6" fill={tint === '#1d4ed8' ? '#93c5fd' : '#8fb8cc'} stroke={tint === '#1d4ed8' ? '#1e40af' : '#4a7488'} strokeWidth="1.5"/>
          </g>
        </g>
      )}
      {specimen === 'paramecium' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e0f0f0' : '#eaf5f5'} />
          <g transform="translate(100,103)">
            <path d="M-60 0 Q-50 -45 0 -55 Q55 -40 60 0 Q55 40 0 55 Q-50 45 -60 0 Z" fill={tint ? tint : '#5a9898'} filter="url(#cytoTex)" opacity="0.9"/>
            {Array.from({length: 26}, (_, i) => {
              const a = (i / 26) * Math.PI * 2 - Math.PI / 2;
              const rx = Math.abs(Math.cos(a)) * 0.5 + 0.5;
              const x = Math.cos(a) * (60 - 12 * rx);
              const y = Math.sin(a) * (55 - 12 * rx);
              return <line key={i} x1={x} y1={y} x2={Math.cos(a) * 66 * (Math.abs(Math.cos(a))*0.3+0.7)} y2={Math.sin(a) * 60 * (Math.abs(Math.sin(a))*0.3+0.7)} stroke={tint ? tint : '#3c7777'} strokeWidth="1.2" opacity="0.8"/>;
            })}
            <ellipse cx="-6" cy="-8" rx="12" ry="9" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#2c5a5a'} opacity="0.9"/>
            <ellipse cx="-6" cy="-8" rx="5" ry="3.5" fill={tint === '#1d4ed8' ? '#1e40af' : '#1a3c3c'} opacity="0.9"/>
            <circle cx="25" cy="-28" r="6" fill={tint === '#1d4ed8' ? '#93c5fd' : '#7ab0b0'} stroke="#3c7777" strokeWidth="1.5"/>
            <circle cx="25" cy="28" r="6" fill={tint === '#1d4ed8' ? '#93c5fd' : '#7ab0b0'} stroke="#3c7777" strokeWidth="1.5"/>
            <path d="M-15 -30 Q 15 -20 25 0 Q 15 8 5 -8 Z" fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#2c5a5a'} strokeWidth="2" opacity="0.7"/>
            <ellipse cx="-20" cy="25" rx="10" ry="6" fill={tint ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)'} opacity="0.7"/>
          </g>
        </g>
      )}
      {specimen === 'volvox' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e2f3e0' : '#ebf8e9'} />
          <g transform="translate(100,110)">
            <circle cx="0" cy="0" r="75" fill={tint ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.6)'} stroke={tint ? tint : '#3f9142'} strokeWidth="3"/>
            {Array.from({length: 34}, (_, i) => {
              const a = (i / 34) * Math.PI * 2;
              const r = 66;
              return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="5" fill={tint ? tint : '#2f7d33'} opacity="0.9"/>;
            })}
            <circle cx="-18" cy="8" r="22" fill={tint ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)'} stroke={tint ? tint : '#3f9142'} strokeWidth="2"/>
            <circle cx="-6" cy="3" r="3" fill={tint ? tint : '#2f7d33'} />
            <circle cx="-18" cy="14" r="3" fill={tint ? tint : '#2f7d33'} />
            <circle cx="-27" cy="6" r="3" fill={tint ? tint : '#2f7d33'} />
            <circle cx="16" cy="-30" r="15" fill={tint ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)'} stroke={tint ? tint : '#3f9142'} strokeWidth="1.8"/>
            <circle cx="14" cy="-27" r="2.5" fill={tint ? tint : '#2f7d33'} />
            <circle cx="20" cy="-33" r="2.5" fill={tint ? tint : '#2f7d33'} />
          </g>
        </g>
      )}
      {specimen === 'diatom' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f6efdd' : '#f8f3e4'} />
          <g transform="translate(-105,-105)">
          {[
            {cx: 55, cy: 55, ang: -20},
            {cx: 130, cy: 130, ang: 15},
            {cx: 100, cy: 45, ang: 60},
            {cx: 55, cy: 165, ang: 10},
            {cx: 155, cy: 70, ang: -45},
          ].map((d, i) => (
            <g key={i} transform={`translate(${d.cx},${d.cy}) rotate(${d.ang})`}>
              <rect x="-34" y="-15" width="68" height="30" rx="15" fill={tint ? tint : '#c8a45a'} filter="url(#cytoTex)" opacity="0.85"/>
              <rect x="-34" y="-15" width="68" height="30" rx="15" fill="none" stroke={tint === '#1d4ed8' ? '#1e40af' : '#8a7226'} strokeWidth="2"/>
              {Array.from({length: 10}, (_, j) => (
                <line key={j} x1={-32 + j * 7} y1="-12" x2={-32 + j * 7} y2="12" stroke={tint === '#1d4ed8' ? '#1e40af' : '#8a7226'} strokeWidth="1" opacity="0.6"/>
              ))}
              <line x1="0" y1="-14" x2="0" y2="14" stroke={tint === '#1d4ed8' ? '#1e40af' : '#6f5a14'} strokeWidth="1.5" opacity="0.7"/>
            </g>
          ))}
          </g>
        </g>
      )}
      {specimen === 'yeast' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f9efd9' : '#fbf3e2'} />
          <g transform="translate(-108,-95)">
          {[
            {cx: 60, cy: 60, r: 18, bud: {x: 15, y: 12, r: 9}},
            {cx: 130, cy: 40, r: 22, bud: {x: -18, y: 14, r: 10}},
            {cx: 45, cy: 140, r: 20, bud: {x: 14, y: -15, r: 9}},
            {cx: 135, cy: 165, r: 17, bud: null},
            {cx: 90, cy: 110, r: 15, bud: null},
            {cx: 175, cy: 105, r: 14, bud: {x: -12, y: -10, r: 7}},
          ].map((c, i) => (
            <g key={i}>
              {c.bud && <circle cx={c.cx + c.bud.x} cy={c.cy + c.bud.y} r={c.bud.r} fill={tint ? tint : '#d9bc70'} filter="url(#cytoTex)" opacity="0.9"/>}
              <circle cx={c.cx} cy={c.cy} r={c.r} fill={tint ? tint : '#d9bc70'} filter="url(#cytoTex)" opacity="0.9"/>
              <circle cx={c.cx - c.r * 0.3} cy={c.cy - c.r * 0.3} r={c.r * 0.45} fill={tint === '#1d4ed8' ? '#1d4ed8' : '#8a6a2c'} opacity="0.85"/>
              <circle cx={c.cx - c.r * 0.4} cy={c.cy - c.r * 0.4} r={c.r * 0.2} fill={tint === '#1d4ed8' ? '#1e40af' : '#5e4518'} opacity="0.9"/>
              <ellipse cx={c.cx - c.r * 0.3} cy={c.cy - c.r * 0.5} rx={c.r * 0.5} ry={c.r * 0.2} fill="rgba(255,255,255,0.25)"/>
            </g>
          ))}
          </g>
        </g>
      )}
      {specimen === 'fungal' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f6efdc' : '#f8f2e2'} />
          <g transform="translate(-95,-60)">
            <path d="M10 40 Q 60 20 100 50 T 190 35" fill="none" stroke={tint ? tint : '#a8925e'} filter="url(#cytoTex)" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
            <path d="M30 130 Q 80 110 120 140 T 190 120" fill="none" stroke={tint ? tint : '#a8925e'} filter="url(#cytoTex)" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
            <path d="M90 35 Q 95 85 80 130" fill="none" stroke={tint ? tint : '#a8925e'} filter="url(#cytoTex)" strokeWidth="4.5" strokeLinecap="round" opacity="0.8"/>
            <path d="M150 45 Q 145 90 140 122" fill="none" stroke={tint ? tint : '#a8925e'} filter="url(#cytoTex)" strokeWidth="4.5" strokeLinecap="round" opacity="0.8"/>
            {[[55,28],[100,50],[150,42],[60,128],[95,140],[150,122]].map(([x,y],i) => (
              <rect key={i} x={x-1.5} y={y-12} width="3" height="24" fill={tint === '#1d4ed8' ? '#1e40af' : '#8a6f3a'} opacity="0.8"/>
            ))}
            {[[40,15],[75,10],[160,12],[25,150],[70,155],[180,148]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="6" fill={tint ? tint : '#c9b37a'} filter="url(#cytoTex)" opacity="0.9"/>
            ))}
          </g>
        </g>
      )}
        </g>
        <rect x="-200" y="-200" width="600" height="500" fill="url(#fieldLight)" pointerEvents="none" />
        <rect x="-200" y="-200" width="600" height="500" fill="url(#fieldCast)" pointerEvents="none" />
        <g opacity="0.3" pointerEvents="none">
          <circle cx="60" cy="185" r="1.6" fill="#5a4a30" />
          <circle cx="58" cy="186" r="0.8" fill="#5a4a30" />
          <circle cx="245" cy="55" r="1.8" fill="#55493a" />
          <circle cx="305" cy="205" r="1" fill="#55493a" />
          <circle cx="180" cy="235" r="1.3" fill="#55493a" />
          <circle cx="265" cy="92" r="11" fill="rgba(255,255,255,0.10)" stroke="rgba(90,90,105,0.35)" strokeWidth="1" />
          <circle cx="260" cy="87" r="3.2" fill="rgba(255,255,255,0.35)" />
          <path d="M-70 32 Q 30 22 125 36" stroke="rgba(120,110,90,0.16)" strokeWidth="0.8" fill="none" />
          <path d="M-55 34 Q 35 24 115 38" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" fill="none" />
        </g>
        <rect x="-200" y="-200" width="600" height="500" filter="url(#mottle)" opacity="0.5" pointerEvents="none" />
        <rect x="-200" y="-200" width="600" height="500" filter="url(#grain)" opacity="0.6" pointerEvents="none" />
      </g>
    </g>
  );
}

export default function Microscope() {
  const [specimen, setSpecimen] = useState<Specimen>('onion');
  const [objective, setObjective] = useState<Objective>('10x');
  const [coarse, setCoarse] = useState(40);
  const [fine, setFine] = useState(50);
  const [light, setLight] = useState(70);
  const [diaphragm, setDiaphragm] = useState(80);
  const [stain, setStain] = useState<Stain>('none');
  const [stained, setStained] = useState(false);
  const [perfectAchieved, setPerfectAchieved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [scaleBar, setScaleBar] = useState(true);
  const [observations, setObservations] = useState<string[]>([]);
  const [obsInput, setObsInput] = useState('');
  const [showAllSpecimens, setShowAllSpecimens] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Feature 1: Eyepiece Selection
  const [eyepiece, setEyepiece] = useState<Eyepiece>('WF10x');

  // Feature 2: Stage X/Y Controls
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);

  // Feature 3: Condenser Height
  const [condenser, setCondenser] = useState(50);

  // Feature 5: Oil Immersion
  const [oilApplied, setOilApplied] = useState(false);

  // Feature 6: Measurement Tool
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);

  // Feature 8: Coarse Focus Warning
  const [coarseWarning, setCoarseWarning] = useState('');
  const prevCoarseRef = useRef(coarse);

  const obj = OBJECTIVES.find(o => o.id === objective)!;
  const zoomMap: Record<Objective, number> = { '4x': 0.5, '10x': 1, '40x': 2.2, '100x': 4 };
  const zoom = zoomMap[objective] * (eyepiece === 'WF15x' ? 1.5 : 1);

  const focusScore = Math.abs(coarse - PERFECT) * 0.6 + Math.abs(fine - 50) * 0.12;
  let blur = Math.min(focusScore * 0.35, 8);
  // Feature 5: Oil immersion reduces blur
  if (oilApplied && objective === '100x') blur *= 0.6;
  const sharpness = Math.max(0, 100 - focusScore * 2);
  const isPerfect = focusScore < 4;
  // Feature 3: Condenser brightness modifier
  const condenserMod = 1 - Math.abs(condenser - 50) / 80;
  const brightness = (light / 100) * (diaphragm / 100) * 1.4 + 0.3;
  const adjustedBrightness = brightness * condenserMod;
  const scaleBarMicron = Math.round(100 / (zoom) * 10) / 10;

  useEffect(() => {
    if (isPerfect && !perfectAchieved) setPerfectAchieved(true);
  }, [isPerfect, perfectAchieved]);

  const specimenInfo = SPECIMENS.find(s => s.id === specimen)!;
  const SPECIMEN_COLLAPSED_COUNT = 4;
  const visibleSpecimens = showAllSpecimens
    ? SPECIMENS
    : SPECIMENS.slice(0, SPECIMEN_COLLAPSED_COUNT).some(s => s.id === specimen)
      ? SPECIMENS.slice(0, SPECIMEN_COLLAPSED_COUNT)
      : [...SPECIMENS.slice(0, SPECIMEN_COLLAPSED_COUNT), specimenInfo];
  const hiddenSpecimenCount = SPECIMENS.length - SPECIMEN_COLLAPSED_COUNT;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (measureMode) {
      // Feature 6: Measurement tool click handler
      const svg = (e.target as SVGElement).closest('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * 300;
      const svgY = ((e.clientY - rect.top) / rect.height) * 300;
      setMeasurePoints(prev => {
        if (prev.length >= 2) return [{ x: svgX, y: svgY }];
        return [...prev, { x: svgX, y: svgY }];
      });
      return;
    }
    setDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart) return;
    const maxOff = 80;
    setOffsetX(Math.max(-maxOff, Math.min(maxOff, e.clientX - dragStart.x)));
    setOffsetY(Math.max(-maxOff, Math.min(maxOff, e.clientY - dragStart.y)));
  };
  const handleMouseUp = () => setDragging(false);

  const resetSlide = () => {
    setCoarse(40); setFine(50); setPerfectAchieved(false);
    setOffsetX(0); setOffsetY(0); setStained(false); setStain('none');
    setStageX(0); setStageY(0);
  };
  const applyStain = () => { if (stain !== 'none') setStained(true); };
  const addObs = () => { if (obsInput.trim()) { setObservations(prev => [...prev, obsInput.trim()]); setObsInput(''); } };

  // Feature 4: Parfocal — auto-adjust coarse when objective changes
  const prevObjectiveRef = useRef(objective);
  useEffect(() => {
    if (prevObjectiveRef.current !== objective) {
      prevObjectiveRef.current = objective;
      setCoarse(prev => Math.round(prev + (PERFECT - prev) * 0.3));
    }
  }, [objective]);

  // Feature 8: Coarse focus warning at high power
  useEffect(() => {
    const delta = Math.abs(coarse - prevCoarseRef.current);
    if ((objective === '40x' || objective === '100x') && delta > 10) {
      setCoarseWarning('Caution: Coarse focus at high power may damage the slide!');
    }
    prevCoarseRef.current = coarse;
  }, [coarse, objective]);

  useEffect(() => {
    if (!coarseWarning) return;
    const timer = setTimeout(() => setCoarseWarning(''), 3000);
    return () => clearTimeout(timer);
  }, [coarseWarning]);

  // Feature 5: Reset oil when leaving 100x
  useEffect(() => {
    if (objective !== '100x') setOilApplied(false);
  }, [objective]);

  // Feature 6: Measurement line coordinates
  const measureLineLength = measurePoints.length === 2
    ? Math.sqrt(
        Math.pow(measurePoints[1].x - measurePoints[0].x, 2) +
        Math.pow(measurePoints[1].y - measurePoints[0].y, 2)
      ) : 0;
  const measureMicron = measureLineLength > 0
    ? (measureLineLength * scaleBarMicron / 60).toFixed(1)
    : '0';

  // Advanced: Precision mode for fine slider steps
  const [precisionMode, setPrecisionMode] = useState(false);

  const { advancedOpen } = useLabControls({
    hasAdvanced: true,
    dataset: {
      name: "Microscope View State",
      columns: [
        { key: "specimen", label: "Specimen" },
        { key: "objective", label: "Objective" },
        { key: "totalMag", label: "Total mag" },
        { key: "coarse", label: "Coarse" },
        { key: "fine", label: "Fine" },
        { key: "light", label: "Light (%)" },
        { key: "diaphragm", label: "Diaphragm (%)" },
        { key: "condenser", label: "Condenser (%)" },
        { key: "stageX", label: "Stage X" },
        { key: "stageY", label: "Stage Y" },
        { key: "sharpness", label: "Sharpness (%)" },
      ],
      rows: [{
        specimen,
        objective,
        totalMag: Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1)),
        coarse,
        fine,
        light,
        diaphragm,
        condenser,
        stageX,
        stageY,
        sharpness: Math.round(sharpness),
      }],
    },
  });

  // Feature 7: Screenshot
  const handleCapture = () => {
    const svgEl = viewerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microscope-${specimen}-${obj.mag}x.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNotebookDownload = () => {
    const lines = [
      `Edu-Platform Microscope Lab Notebook`,
      `Specimen: ${specimenInfo.label}`,
      `Total Magnification: ${Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x`,
      `Stain: ${stained ? STAINS.find(s => s.id === stain)?.label ?? 'None' : 'None'}`,
      `Observations: ${observations.length}`,
      `----------------------------------------`,
      ...observations.map((o, i) => `${i + 1}. ${o}`),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microscope-notebook-${specimen}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sim-container space-y-4">
      {advancedOpen && (
        <div className="sim-panel">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Precision & Optical Configuration</h3>
            <button
              onClick={() => setPrecisionMode(p => !p)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
              style={{
                background: precisionMode ? 'linear-gradient(135deg, #FF9F4C, #E8852E)' : 'hsl(var(--muted))',
                color: precisionMode ? '#fff' : 'hsl(var(--muted-foreground))',
                borderColor: precisionMode ? 'transparent' : 'hsl(var(--border))',
              }}
            >
              {precisionMode ? 'Precision: Fine (0.1 steps)' : 'Precision: Coarse (1.0 steps)'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
            { label: 'Total Magnification', value: `${Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}×`, color: '#1A3550' },
            { label: 'Objective NA', value: obj.na, color: '#5B7FA5' },
            { label: 'Scale Bar', value: `${scaleBarMicron} µm/div`, color: '#6A9B7A' },
            { label: 'Brightness', value: `${Math.round(adjustedBrightness * 100)}%`, color: '#B89555' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                <div className="font-mono text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: '#9A9A9A' }}>
            Objective {objective} · Eyepiece {eyepiece} · {specimenInfo.label}. Precision mode enables 0.1-step focus control for fine adjustment near the focal plane.
          </p>
        </div>
      )}
      {/* Top: Compact Controls + Eyepiece side by side */}
      <div className="grid lg:grid-cols-[260px,1fr] gap-4 items-start">
        {/* Compact Controls */}
        <div className="sim-panel p-2 sm:p-3 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wide text-muted-foreground" style={{ fontFamily: 'Space Grotesk' }}>Controls</h3>

          {/* Objective buttons - tiny inline */}
          <div>
            <div className="sim-label mb-1">Objective</div>
            <div className="flex gap-1">
              {OBJECTIVES.map(ob => (
                <button key={ob.id} onClick={() => setObjective(ob.id)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${objective === ob.id ? 'text-white' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                  style={objective === ob.id ? { background: ob.color, borderColor: ob.color } : {}}>
                  {ob.id}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x | NA: {obj.na}
            </p>
          </div>

          {/* Eyepiece tiny */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Eyepiece:</span>
            {(['WF10x', 'WF15x'] as Eyepiece[]).map(ep => (
              <button key={ep} onClick={() => setEyepiece(ep)}
                className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${eyepiece === ep ? 'text-white border-transparent' : 'border-border text-muted-foreground'}`}
                style={eyepiece === ep ? { background: '#1A3550' } : {}}>
                {ep}
              </button>
            ))}
          </div>

          {/* Oil immersion inline */}
          {objective === '100x' && !oilApplied && (
            <div className="flex items-center gap-1 p-1.5 rounded text-[10px]" style={{ background: '#FAF8F2', border: '1px solid #B89555' }}>
              <Droplets className="w-3 h-3 text-amber-500" />
              <span className="text-amber-800 font-semibold flex-1">Oil required</span>
              <button onClick={() => setOilApplied(true)} className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#B89555' }}>Apply</button>
            </div>
          )}
          {objective === '100x' && oilApplied && (
            <div className="flex items-center gap-1 text-[10px] text-green-700 font-semibold">
              <Droplets className="w-3 h-3" /> Oil applied
            </div>
          )}

          {/* Coarse warning inline */}
          {coarseWarning && (
            <div className="flex items-center gap-1 p-1.5 rounded text-[10px] animate-pulse" style={{ background: '#FAF5F3', border: '1px solid #C47B6B' }}>
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-red-700 font-semibold">{coarseWarning}</span>
            </div>
          )}

          {/* Sliders - compact */}
          {[
            { label: 'Coarse', val: coarse, set: setCoarse, min: 0, max: 100, color: '#1A3550', test: 'slider-coarse-focus', step: precisionMode ? 0.1 : 1 },
            { label: 'Fine', val: fine, set: setFine, min: 0, max: 100, color: '#5B7FA5', test: 'slider-fine-focus', step: precisionMode ? 0.1 : 1 },
            { label: 'Light', val: light, set: setLight, min: 10, max: 100, color: '#B89555', test: 'slider-light', step: precisionMode ? 1 : 1 },
            { label: 'Diaphragm', val: diaphragm, set: setDiaphragm, min: 10, max: 100, color: '#8B7BB5', test: 'slider-diaphragm', step: precisionMode ? 1 : 1 },
            { label: 'Condenser', val: condenser, set: setCondenser, min: 0, max: 100, color: '#B89555', test: 'slider-condenser', step: precisionMode ? 1 : 1 },
          ].map(ctrl => (
            <div key={ctrl.label} className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] text-muted-foreground w-10 sm:w-14 flex-shrink-0">{ctrl.label}</span>
              <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.val}
                data-testid={ctrl.test}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="flex-1 h-1 min-w-0" style={{ accentColor: ctrl.color }} />
              <span className="text-[10px] font-mono w-5 sm:w-6 text-right flex-shrink-0" style={{ color: ctrl.color }}>{ctrl.val}</span>
            </div>
          ))}

          {/* Stage X/Y - inline */}
          <div className="p-2 rounded border" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Stage</span>
              <button onClick={() => { setStageX(0); setStageY(0); }}
                className="text-[9px] px-1.5 py-0.5 rounded border border-border hover:bg-muted font-semibold">Reset</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-3">X</span>
                <input type="range" min={-50} max={50} value={stageX}
                  onChange={e => setStageX(Number(e.target.value))}
                  className="flex-1 h-1 min-w-0" style={{ accentColor: '#059669' }} />
                <span className="text-[10px] font-mono w-5 text-right flex-shrink-0" style={{ color: '#059669' }}>{stageX > 0 ? '+' : ''}{stageX}</span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-3">Y</span>
                <input type="range" min={-50} max={50} value={stageY}
                  onChange={e => setStageY(Number(e.target.value))}
                  className="flex-1 h-1 min-w-0" style={{ accentColor: '#059669' }} />
                <span className="text-[10px] font-mono w-5 text-right flex-shrink-0" style={{ color: '#059669' }}>{stageY > 0 ? '+' : ''}{stageY}</span>
              </div>
            </div>
          </div>

          {/* Focus quality bar */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground">Focus</span>
              <span className={`text-[10px] font-bold ${isPerfect ? 'text-green-600' : sharpness > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                {isPerfect ? 'In Focus!' : `${Math.round(sharpness)}%`}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${sharpness}%`, background: isPerfect ? '#6A9B7A' : sharpness > 60 ? '#B89555' : '#C47B6B' }} />
            </div>
          </div>
        </div>

        {/* Eyepiece Viewer */}
        <div className="sim-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h3 className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Space Grotesk' }}>Eyepiece View</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={handleCapture}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border border-border hover:bg-muted flex items-center gap-1">
                <Camera className="w-3 h-3" /> Capture
              </button>
              <button onClick={() => { setMeasureMode(m => !m); setMeasurePoints([]); }}
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border flex items-center gap-1 transition-all ${measureMode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border hover:bg-muted'}`}>
                <Crosshair className="w-3 h-3" /> {measureMode ? 'Measuring' : 'Measure'}
              </button>
              <button onClick={() => setScaleBar(s => !s)} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border border-border hover:bg-muted">
                {scaleBar ? 'Hide' : 'Show'} Scale
              </button>
              <div className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-1 rounded">{Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x</div>
            </div>
          </div>

          <div className="flex justify-center">
            <div ref={viewerRef}
              className={`relative overflow-hidden aspect-square w-full max-w-[300px] max-sm:max-w-[200px] touch-none ${measureMode ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                borderRadius: '50%',
                boxShadow: `0 0 0 12px #1A2A35, 0 0 0 16px #1A3550, 0 0 60px rgba(0,0,0,0.7), inset 0 0 ${light/3}px rgba(${Math.round(255*light/100)},${Math.round(240*light/100)},${Math.round(200*light/100)},0.15)`,
                background: `rgba(${Math.round(245*light/100)},${Math.round(238*light/100)},${Math.round(208*light/100)},1)`,
              }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <svg width="100%" height="100%" viewBox="0 0 300 300">
                <defs>
                  <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="noise" />
                    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.55 0 0 0 0 0.55 0 0 0 0.30 0" />
                  </filter>
                  <filter id="microscopy" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="3" seed="7" result="warp" />
                    <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="warped" />
                    <feGaussianBlur in="warped" stdDeviation="1.0" result="blur" />
                    <feComposite in="warped" in2="blur" operator="out" result="rim" />
                    <feColorMatrix in="rim" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.30 0" result="rimW" />
                    <feMerge>
                      <feMergeNode in="warped" />
                      <feMergeNode in="rimW" />
                    </feMerge>
                  </filter>
                  <filter id="cytoTex" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="4" seed="11" result="n" />
                    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.32  0 0 0 0.5 0" result="tint" />
                    <feComposite in="SourceGraphic" in2="tint" operator="in" result="tex" />
                    <feBlend mode="multiply" in="tex" in2="SourceGraphic" />
                  </filter>
                  <filter id="mottle" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3" result="n" />
                    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.44  0 0 0 0 0.36  0 0 0 0.3 0" />
                  </filter>
                  <radialGradient id="fieldLight" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor="rgba(255,252,240,0.32)" />
                    <stop offset="45%" stopColor="rgba(255,249,232,0.14)" />
                    <stop offset="80%" stopColor="rgba(255,246,222,0.03)" />
                    <stop offset="100%" stopColor="rgba(255,244,220,0)" />
                  </radialGradient>
                  <radialGradient id="fieldCast" cx="50%" cy="50%" r="72%">
                    <stop offset="68%" stopColor="rgba(130,170,220,0)" />
                    <stop offset="100%" stopColor="rgba(130,170,220,0.22)" />
                  </radialGradient>
                  <radialGradient id="cyto" cx="50%" cy="42%" r="72%">
                    <stop offset="0%" stopColor="#f7ecd9" />
                    <stop offset="100%" stopColor="#e2cc9e" />
                  </radialGradient>
                  <radialGradient id="cytoIod" cx="50%" cy="42%" r="72%">
                    <stop offset="0%" stopColor="#f2e3b0" />
                    <stop offset="100%" stopColor="#d6b86e" />
                  </radialGradient>
                  <radialGradient id="cytoBlue" cx="50%" cy="42%" r="72%">
                    <stop offset="0%" stopColor="#dbeafe" />
                    <stop offset="100%" stopColor="#a5c6f8" />
                  </radialGradient>
                  <radialGradient id="cytoPink" cx="50%" cy="42%" r="72%">
                    <stop offset="0%" stopColor="#f9d7de" />
                    <stop offset="100%" stopColor="#e9adba" />
                  </radialGradient>
                  <radialGradient id="cytoGreen" cx="50%" cy="42%" r="72%">
                    <stop offset="0%" stopColor="#eaf3df" />
                    <stop offset="100%" stopColor="#cbe3bb" />
                  </radialGradient>
                  <radialGradient id="nucleus" cx="40%" cy="35%" r="75%">
                    <stop offset="0%" stopColor="#6a4532" />
                    <stop offset="55%" stopColor="#52301f" />
                    <stop offset="100%" stopColor="#331d12" />
                  </radialGradient>
                  <radialGradient id="nucleusBlue" cx="40%" cy="35%" r="75%">
                    <stop offset="0%" stopColor="#5b86e8" />
                    <stop offset="55%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#10309a" />
                  </radialGradient>
                  <radialGradient id="nucleusPurple" cx="40%" cy="35%" r="75%">
                    <stop offset="0%" stopColor="#6a5a9a" />
                    <stop offset="55%" stopColor="#44336e" />
                    <stop offset="100%" stopColor="#241a45" />
                  </radialGradient>
                  <radialGradient id="rbc" cx="50%" cy="50%" r="62%">
                    <stop offset="0%" stopColor="#eec4b6" />
                    <stop offset="45%" stopColor="#C47B6B" />
                    <stop offset="100%" stopColor="#96362d" />
                  </radialGradient>
                  <radialGradient id="rbcStain" cx="50%" cy="50%" r="62%">
                    <stop offset="0%" stopColor="#f9c3d8" />
                    <stop offset="45%" stopColor="#ec8fb5" />
                    <stop offset="100%" stopColor="#c24f85" />
                  </radialGradient>
                  <radialGradient id="wbc" cx="45%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#d4c8ec" />
                    <stop offset="60%" stopColor="#a794d4" />
                    <stop offset="100%" stopColor="#7d68b8" />
                  </radialGradient>
                  <radialGradient id="wbcBlue" cx="45%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#c2d6f8" />
                    <stop offset="60%" stopColor="#8fafea" />
                    <stop offset="100%" stopColor="#6889d8" />
                  </radialGradient>
                </defs>
                <clipPath id="circleMask">
                  <circle cx="150" cy="150" r="148" />
                </clipPath>
                <g clipPath="url(#circleMask)">
                  <SpecimenSVG
                    specimen={specimen} zoom={zoom} blur={blur}
                    brightness={adjustedBrightness} stain={stained ? stain : 'none'}
                    offsetX={150 + offsetX + stageX} offsetY={150 + offsetY + stageY}
                  />
                </g>
                <line x1="150" y1="30" x2="150" y2="270" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="30" y1="150" x2="270" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx="150" cy="150" r="55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <circle cx="150" cy="150" r="110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                {measureMode && measurePoints.length === 2 && (
                  <g>
                    <line x1={measurePoints[0].x} y1={measurePoints[0].y} x2={measurePoints[1].x} y2={measurePoints[1].y}
                      stroke="#C47B6B" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r="4" fill="#C47B6B" stroke="white" strokeWidth="1.5" />
                    <circle cx={measurePoints[1].x} cy={measurePoints[1].y} r="4" fill="#C47B6B" stroke="white" strokeWidth="1.5" />
                    <rect x={(measurePoints[0].x + measurePoints[1].x) / 2 - 35} y={(measurePoints[0].y + measurePoints[1].y) / 2 - 14}
                      width="70" height="18" rx="4" fill="rgba(0,0,0,0.8)" />
                    <text x={(measurePoints[0].x + measurePoints[1].x) / 2} y={(measurePoints[0].y + measurePoints[1].y) / 2}
                      textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white" fontWeight="bold">
                      {measureMicron} µm
                    </text>
                  </g>
                )}
                {measureMode && measurePoints.length === 1 && (
                  <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r="4" fill="#C47B6B" stroke="white" strokeWidth="1.5" />
                )}
                {scaleBar && isPerfect && (
                  <g transform="translate(30,270)">
                    <rect x="0" y="-8" width="60" height="4" fill="white" opacity="0.8"/>
                    <line x1="0" y1="-8" x2="0" y2="-2" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                    <line x1="60" y1="-8" x2="60" y2="-2" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                    <text x="30" y="-11" textAnchor="middle" fontSize="8" fill="white" opacity="0.8">{scaleBarMicron} µm</text>
                  </g>
                )}
                <circle cx="150" cy="150" r="148" fill="none" stroke="black" strokeWidth="8" opacity="0.7" />
                <radialGradient id="vig" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="transparent"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0.6)"/>
                </radialGradient>
                <circle cx="150" cy="150" r="148" fill="url(#vig)"/>
                {light < 20 && <circle cx="150" cy="150" r="148" fill={`rgba(0,0,0,${(20-light)/25})`}/>}
                {objective === '100x' && oilApplied && <circle cx="150" cy="150" r="148" fill="rgba(200,220,255,0.06)" />}
                {objective === '100x' && !oilApplied && <circle cx="150" cy="150" r="148" fill="rgba(200,220,255,0.04)" />}
              </svg>
              <div className="absolute bottom-2 right-2 text-xs text-white/50 pointer-events-none select-none">
                {measureMode ? 'Click to measure' : 'drag to pan'}
              </div>
            </div>
          </div>

          {isPerfect && perfectAchieved && (
            <div className="mt-3 rounded-xl p-3 flex items-start gap-2 border" style={{ background: '#F2F8F4', borderColor: '#A8D5B6' }}>
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-800">
                <strong>In focus at {Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x!</strong> You can see {specimenInfo.desc.toLowerCase()}. Drag the slide to explore different areas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Specimen, Data, Notebook */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Specimen Selection */}
        <div className="sim-panel">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Specimen</h3>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {visibleSpecimens.map(s => (
              <button key={s.id} onClick={() => { setSpecimen(s.id); resetSlide(); }}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${specimen === s.id ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                style={specimen === s.id ? { background: 'hsl(var(--primary)/0.08)' } : {}}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TINT_COLORS[s.id] }} />
                <div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.size}</div>
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowAllSpecimens(v => !v)}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              {showAllSpecimens ? (
                <>Show fewer <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show all {hiddenSpecimenCount} more specimens <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          <div className="sim-label">Staining</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {STAINS.map(s => (
              <button key={s.id} onClick={() => setStain(s.id)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all ${stain === s.id ? 'border-2 text-white' : 'border-border text-muted-foreground'}`}
                style={stain === s.id ? { borderColor: s.id === 'none' ? '#94a3b8' : s.color, background: s.id === 'none' ? '#94a3b8' : s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          {stain !== 'none' && !stained && (
            <button onClick={applyStain} className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: STAINS.find(s=>s.id===stain)!.color }}>
              Apply Stain to Slide
            </button>
          )}
          {stained && <div className="text-xs text-green-600 font-semibold p-2 rounded-lg bg-green-50">Stain applied</div>}
          {stain !== 'none' && <p className="text-xs text-muted-foreground mt-1">{STAINS.find(s=>s.id===stain)!.targets}</p>}
        </div>

        {/* Specimen Data */}
        <div className="sim-panel">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Specimen Data</h3>
          <p className="text-sm text-foreground mb-3">{specimenInfo.desc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Domain', val: specimenInfo.domain },
              { label: 'Cell Wall', val: specimenInfo.wall },
              { label: 'Size', val: specimenInfo.size },
            ].map(item => (
              <div key={item.label} className="bg-muted rounded-lg p-2">
                <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                <div className="text-xs font-semibold">{item.val}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 rounded-lg bg-muted text-xs text-muted-foreground">
            <Lightbulb className="w-3 h-3 inline mr-1" />
            <strong>Tip:</strong> {objective === '4x' ? 'Start here to find your sample. Use coarse focus.' : objective === '10x' ? 'Good for tissue-level view. Use coarse then fine focus.' : objective === '40x' ? 'Use only fine focus here — coarse may crack the slide.' : 'Use oil immersion for maximum resolution. Fine focus only.'}
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <ZoomIn className="w-3 h-3 text-primary" />
              <h3 className="font-bold text-xs" style={{ fontFamily: 'Space Grotesk' }}>Optical Properties</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Magnification', val: `${Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x` },
                { label: 'NA', val: obj.na },
                { label: 'Resolution', val: `${(0.61 * 550 / (parseFloat(obj.na) * 1000)).toFixed(2)} µm` },
                { label: 'Depth of Field', val: objective === '4x' ? '~700 µm' : objective === '10x' ? '~100 µm' : objective === '40x' ? '~10 µm' : '~1 µm' },
              ].map(item => (
                <div key={item.label} className="bg-muted rounded-lg p-2">
                  <div className="text-muted-foreground">{item.label}</div>
                  <div className="font-mono font-bold">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lab Notebook */}
        <div className="sim-panel">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Lab Notebook</h3>
            <button
              onClick={handleNotebookDownload}
              disabled={observations.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 disabled:opacity-40"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <input type="text" value={obsInput} onChange={e => setObsInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addObs()}
              placeholder={`Observation at ${Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x...`}
              className="flex-1 px-3 py-2 text-xs rounded-lg border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }} />
            <button onClick={addObs} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#1A3550' }}>Add</button>
          </div>
          {observations.map((o, i) => (
            <div key={i} className="text-xs px-2 py-1 rounded bg-muted mb-1 flex gap-2">
              <span className="text-muted-foreground font-mono">{i+1}.</span>
              <span>{o}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
