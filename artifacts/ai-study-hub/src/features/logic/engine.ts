import type { Circuit, CircuitNode, GateType } from "./types";
import { realSensors } from "./realSensors";

function evalNode(node: CircuitNode): boolean[] {
  const i = (k: string) => !!node.inputs[k];
  const num = (prefix: string, n: number) => { let v=0; for(let b=0;b<n;b++) if(i(prefix+b)) v|=(1<<b); return v; };
  const setBits = (prefix: string, n: number, val: number) => Array.from({length:n},(_,b)=>!!(val&(1<<b)));
  // Sensor helpers
  const seedH = (() => { let h=0; for(const c of node.id) h=((h<<5)-h+c.charCodeAt(0))|0; return h; })();
  const getTick = () => { if(!(node as any).state) (node as any).state=0; return ((node as any).state as number); };
  const advanceTick = () => { (node as any).state = getTick()+1; return (node as any).state; };
  // Check for real sensor data — returns outputs if node has assigned real channel, null otherwise
  const realData = () => realSensors.getNodeOutputs(node.id);

  // Real sensor data override — check before switch
  const SENSOR_TYPES = ["temp-sensor","humidity-sensor","pressure-sensor","light-sensor","ultrasonic-sensor","ir-sensor","motion-sensor","magnetic-sensor","proximity-sensor","hall-sensor","tilt-sensor","reed-sensor","force-sensor","gas-sensor","microphone-sensor","accelerometer-sensor","gyro-sensor","strain-gauge","bme280","pir-sensor","current-sensor","color-sensor","camera-sensor","gps-module","rfid-reader","nfc-reader","barcode-scanner","fingerprint-sensor","face-recog-cam"];
  if (SENSOR_TYPES.includes(node.type)) {
    const rd = realData();
    if (rd) return rd;
  }

  switch (node.type) {
    // Input Controls
    case "const-0": return [false];
    case "const-1": return [true];
    case "toggle": case "button": case "clock": case "push-button":
    case "pulse-gen": case "edge-det": case "edge-det-f": case "strobe-in":
    case "ready-in": case "ack-in": case "busy-in": case "interrupt-in":
    case "dma-in": case "hold-in": case "bus-req-in": case "test-mode":
    case "enable-all": case "global-reset":
      return [!!node.outputs.out];

    case "dip-switch": return Array.from({length:8},(_,i)=>!!node.outputs[`o${i}`]);
    case "keypad": return [!!node.outputs.d0,!!node.outputs.d1,!!node.outputs.d2,!!node.outputs.d3,!!node.outputs.valid];
    case "analog-in": case "voltage-src-4": case "addr-input": case "control-in":
      return [!!node.outputs.d0,!!node.outputs.d1,!!node.outputs.d2,!!node.outputs.d3];
    case "random": return [Math.random()>0.5];
    case "step-input": return [!!node.outputs.d0,!!node.outputs.d1];

    case "data-bus-in": case "status-in": return Array.from({length:8},(_,i)=>!!node.outputs[`d${i}`]);

    // Output Controls
    case "bulb": case "buzzer": case "status-led": case "thermometer-out":
      return [i("in")];
    case "led": case "tri-led": return [i("r")||i("g")||i("b")];
    case "traffic-light": return [i("r")||i("y")||i("g")];
    case "hex-display": return [i("a")||i("b")||i("c")||i("d")];
    case "digit-display": case "servo-motor":
      return Array.from({length:7},(_,k)=>("abcdefgh"[k] in node.inputs)?!!node.inputs["abcdefgh"[k]]:false);
    case "7-segment": return Array.from({length:7},(_,k)=>("abcdefgh"[k] in node.inputs)?!!node.inputs["abcdefgh"[k]]:false);
    case "bar-graph": case "indicator-panel": case "data-latch-disp":
      return Array.from({length:8},(_,j)=>i(`i${j}`));
    case "dot-matrix": return Array.from({length:25},(_,j)=>i(`p${j}`));
    case "stepper-motor": return [i("a"),i("b"),i("c"),i("d")];
    case "lcd-display": return Array.from({length:8},(_,j)=>i(`d${j}`));
    case "ascii-display": return Array.from({length:7},(_,j)=>i(`b${j}`));
    case "scope-output": case "signal-analyzer": return [i("in"),i("trig")||i("clk")];
    case "voltmeter": case "ammeter": case "tachometer": return [i("in")];
    case "power-meter": return [i("v")||i("i")];
    case "clock-display": return [i("h0"),i("h1"),i("m0"),i("m1"),i("s0"),i("s1")];
    case "seven-seg-4": return Array.from({length:11},(_,j)=>i(["a","b","c","d","e","f","g","d0","d1","d2","d3"][j]));

    // 2-Input Logic Gates
    case "buffer": case "level-shift": return [i("a")];
    case "not": case "open-drain": return [!i("a")];
    case "and": return [i("a")&&i("b")];
    case "nand": return [!(i("a")&&i("b"))];
    case "or": return [i("a")||i("b")];
    case "nor": return [!(i("a")||i("b"))];
    case "xor": return [i("a")!==i("b")];
    case "xnor": return [i("a")===i("b")];

    // N-Input Logic Gates
    case "and3": case "and4": case "and5": case "and6": case "and8":
      return [Object.values(node.inputs).every(Boolean)];
    case "or3": case "or4": case "or5": case "or6": case "or8":
      return [Object.values(node.inputs).some(Boolean)];
    case "nand3": case "nand4": case "nand5": case "nand6": case "nand8":
      return [!Object.values(node.inputs).every(Boolean)];
    case "nor3": case "nor4": case "nor5": case "nor6": case "nor8":
      return [!Object.values(node.inputs).some(Boolean)];
    case "xor3": case "xor4": case "xor5": case "xor6": case "xor8":
      return [Object.values(node.inputs).reduce((a:boolean,b:boolean)=>a!==b,false)];
    case "xnor3": case "xnor4": case "xnor5": case "xnor6": case "xnor8":
      return [Object.values(node.inputs).reduce((a:boolean,b:boolean)=>a!==b,false) ? false : true];

    // Buffer/NOT variants
    case "buffer2": return [i("a"),i("a")];
    case "buffer4": case "buffer-bank-4": return Array.from({length:4},()=>i("a"));
    case "not2": return [!i("a"),!i("a")];
    case "not4": case "inverter-bank-4": return Array.from({length:4},()=>!i("a"));

    // Bank gates
    case "and-bank-4": return [i("a0")&&i("a1"),i("a2")&&i("a3"),i("a4")&&i("a5"),i("a6")&&i("a7")];
    case "or-bank-4": return [i("a0")||i("a1"),i("a2")||i("a3"),i("a4")||i("a5"),i("a6")||i("a7")];
    case "xor-bank-4": return [i("a0")!==i("a1"),i("a2")!==i("a3"),i("a4")!==i("a5"),i("a6")!==i("a7")];
    case "nand-bank-4": return [!(i("a0")&&i("a1")),!(i("a2")&&i("a3")),!(i("a4")&&i("a5")),!(i("a6")&&i("a7"))];
    case "nor-bank-4": return [!(i("a0")||i("a1")),!(i("a2")||i("a3")),!(i("a4")||i("a5")),!(i("a6")||i("a7"))];
    case "constant-bank-4": return [i("v0"),i("v1"),i("v2"),i("v3")];

    // Compound Gates
    case "aoi": return [!((i("a")&&i("b"))||(i("c")&&i("d")))];
    case "oai": return [!((i("a")||i("b"))&&(i("c")||i("d")))];
    case "ao": return [(i("a")&&i("b"))||(i("c")&&i("d"))];
    case "buffer-inv": return [i("a"),!i("a")];
    case "mux2-inv": {const y=i("sel")?i("i1"):i("i0"); return [y,!y];}
    case "and-or-inv": return [!((i("a")&&i("b"))||i("c"))];
    case "or-and": return [(i("a")||i("b"))&&(i("c")||i("d"))];
    case "or-and-inv": return [!((i("a")||i("b"))&&i("c"))];
    case "aoai": return [!(((i("a")&&i("b"))||(i("c")&&i("d")))&&i("e"))];
    case "oaoi": return [!(((i("a")||i("b"))&&(i("c")||i("d")))||i("e"))];
    case "majority": {let c=0; if(i("a"))c++; if(i("b"))c++; if(i("c"))c++; return [c>=2];}
    case "parity3": return [i("a")!==i("b")!==i("c")];
    case "tri-state": return [i("en")?i("a"):false];
    case "tri-state-inv": return [i("en")?!i("a"):false];

    // Arithmetic
    case "half-adder": {const s=i("a")!==i("b"); return [s,i("a")&&i("b")];}
    case "full-adder": {const t=(i("a")?1:0)+(i("b")?1:0)+(i("cin")?1:0); return [t===1||t===3,t>=2];}
    case "half-subtractor": return [i("a")!==i("b"),!i("a")&&i("b")];
    case "full-subtractor": {const d=i("a")!==i("b")!==i("bin"); const bo=(!i("a")&&i("b"))||(!i("a")&&i("bin"))||(i("b")&&i("bin")); return [d,bo];}

    // MUX/DEMUX
    case "mux2": return [i("sel")?i("i1"):i("i0")];
    case "mux4": {const s=(i("s1")?2:0)+(i("s0")?1:0); return [[i("i0"),i("i1"),i("i2"),i("i3")][s]];}
    case "mux8": {const s=(i("s2")?4:0)+(i("s1")?2:0)+(i("s0")?1:0); return [Array.from({length:8},(_,k)=>i(`i${k}`))[s]];}
    case "mux16": {const s=(i("s3")?8:0)+(i("s2")?4:0)+(i("s1")?2:0)+(i("s0")?1:0); return [Array.from({length:16},(_,k)=>i(`i${k}`))[s]];}
    case "decoder": {const idx=(i("b")?2:0)+(i("a")?1:0); return [0===idx,1===idx,2===idx,3===idx];}
    case "dec-2to4": {if(!i("en"))return[false,false,false,false]; const idx=(i("b")?2:0)+(i("a")?1:0); return [0===idx,1===idx,2===idx,3===idx];}
    case "demux1to2": return [i("sel")?false:i("in"),i("sel")?i("in"):false];
    case "demux1to4": {const s=(i("s1")?2:0)+(i("s0")?1:0); return Array.from({length:4},(_,k)=>k===s?i("in"):false);}
    case "demux1to8": {const s=(i("s2")?4:0)+(i("s1")?2:0)+(i("s0")?1:0); return Array.from({length:8},(_,k)=>k===s?i("in"):false);}

    // Encoder/Decoder
    case "prio-enc-4to2": {if(i("i3"))return[true,true,true];if(i("i2"))return[false,true,true];if(i("i1"))return[true,false,true]; return [false,false,i("i0")];}
    case "encoder-8to3": {const v=[i("i7"),i("i6"),i("i5"),i("i4"),i("i3"),i("i2"),i("i1"),i("i0")]; const idx=v.findIndex(x=>x); if(idx===-1)return[false,false,false,false]; const b=(7-idx).toString(2).padStart(3,"0").split("").map(Number); return [!!b[2],!!b[1],!!b[0],true];}
    case "encoder-16to4": {const v=Array.from({length:16},(_,k)=>i(`i${15-k}`)); const idx=v.findIndex(x=>x); if(idx===-1)return[false,false,false,false,false]; const b=(15-idx).toString(2).padStart(4,"0").split("").map(Number); return [!!b[0],!!b[1],!!b[2],!!b[3],true];}
    case "prio-encoder-8to3": {const v=[i("i7"),i("i6"),i("i5"),i("i4"),i("i3"),i("i2"),i("i1"),i("i0")]; const idx=v.findIndex(x=>x); if(idx===-1)return[false,false,false,false]; const b=(7-idx).toString(2).padStart(3,"0").split("").map(Number); return [!!b[2],!!b[1],!!b[0],true];}
    case "prio-encoder-16to4": {const v=Array.from({length:16},(_,k)=>i(`i${15-k}`)); const idx=v.findIndex(x=>x); if(idx===-1)return[false,false,false,false,false]; const b=(15-idx).toString(2).padStart(4,"0").split("").map(Number); return [!!b[0],!!b[1],!!b[2],!!b[3],true];}
    case "decoder-3to8": {const idx=(i("c")?4:0)+(i("b")?2:0)+(i("a")?1:0); return Array.from({length:8},(_,k)=>k===idx);}
    case "decoder-4to16": {const idx=(i("d")?8:0)+(i("c")?4:0)+(i("b")?2:0)+(i("a")?1:0); return Array.from({length:16},(_,k)=>k===idx);}

    // Full comparator
    case "full-comp": {const aV=i("a")?1:0; const bV=i("b")?1:0; return [aV>bV,aV===bV,aV<bV];}
    case "cla-unit": {const g0=i("g0"),g1=i("g1"),p0=i("p0"),p1=i("p1"),cin=i("cin"); const c1=g0||(p0&&cin); const c2=g1||(p1&&g0)||(p1&&p0&&cin); const c3=g1||(p1&&g0)||(p1&&p0&&g0)||(p1&&p0&&p0&&cin); return [c1,c2,c3];}

    // Multi-bit arithmetic
    case "adder-4bit": case "cla-adder-4": case "carry-select-4": case "kogge-stone-4": case "brent-kung-4": {const aV=num("a",4),bV=num("b",4),cin=i("cin")?1:0; const sum=aV+bV+cin; return [...setBits("s",4,sum),sum>15];}
    case "adder-8bit": {const aV=num("a",8),bV=num("b",8),cin=i("cin")?1:0; const sum=aV+bV+cin; return [...setBits("s",8,sum),sum>255];}
    case "subtractor-4bit": {const aV=num("a",4),bV=num("b",4),bin=i("bin")?1:0; const d=aV-bV-bin; return [...setBits("d",4,d),d<0];}
    case "subtractor-8bit": {const aV=num("a",8),bV=num("b",8),bin=i("bin")?1:0; const d=aV-bV-bin; return [...setBits("d",8,d),d<0];}
    case "multiplier-4bit": case "wallace-mul-4": case "booth-mul-4": {const p=num("a",4)*num("b",4); return setBits("p",8,p);}
    case "multiplier-8bit": {const p=num("a",8)*num("b",8); return setBits("p",16,p);}
    case "divider-4bit": {const aV=num("a",4),bV=num("b",4); const q=bV?aV/bV|0:0; const r=bV?aV%bV:0; return [...setBits("q",4,q),...setBits("o",4,r)];}
    case "comparator-4bit": case "comparator-8bit": {const n=num("a",8),m=num("b",8); return [n>m,n===m,n<m];}

    // Code converters
    case "bcd-to-binary": {const v=num("b",4); return setBits("o",4,v>9?9:v);}
    case "binary-to-bcd": {const v=num("b",4); return setBits("d",4,v);}
    case "bcd-to-7seg": {const v=num("b",4); const segs=[0x7e,0x30,0x6d,0x79,0x33,0x5b,0x5f,0x70,0x7f,0x7b]; const s=v<10?segs[v]:0; return [!!(s&1),!!(s&2),!!(s&4),!!(s&8),!!(s&16),!!(s&32),!!(s&64)];}
    case "gray-to-binary": {let v=0; for(let b=7;b>=0;b--) if(i(`g${b}`)) v^=(1<<b); let r=0; while(v){r^=v;v>>=1;} return setBits("b",4,r);}
    case "binary-to-gray": {const v=num("b",4); return setBits("g",4,v^(v>>1));}
    case "excess-3": {const v=num("a",4); return setBits("o",4,v+3);}
    case "gray-counter-dec": {const v=num("a",4); return setBits("o",4,v^(v>>1));}
    case "thermometer-code": {const v=num("a",4); return Array.from({length:15},(_,k)=>k<v);}

    // ALU
    case "alu-4bit": {const aV=num("a",4),bV=num("b",4),s=(i("s1")?2:0)+(i("s0")?1:0); let r=0; if(s===0)r=aV&bV; else if(s===1)r=aV|bV; else if(s===2)r=aV+bV+(i("cin")?1:0); else r=aV-bV; return [...setBits("o",4,r),r>15];}
    case "alu-8bit": {const aV=num("a",8),bV=num("b",8),s=(i("s1")?2:0)+(i("s0")?1:0); let r=0; if(s===0)r=aV&bV; else if(s===1)r=aV|bV; else if(s===2)r=aV+bV+(i("cin")?1:0); else r=aV-bV; return [...setBits("o",8,r),r>255];}

    // Sign/Zero extend
    case "sign-ext-4to8": {const v=num("a",4); const sign=v&8; return setBits("o",8,sign?(v|0xf0):v);}
    case "zero-ext-4to8": {return [...setBits("a",4,0),false,false,false,false];}
    case "bit-reverse-4": {const v=num("a",4); let r=0; for(let b=0;b<4;b++) if(v&(1<<b)) r|=(1<<(3-b)); return setBits("o",4,r);}
    case "byte-swap-16": {const v=num("a",16); const hi=(v>>8)&0xff; const lo=v&0xff; const swapped=(lo<<8)|hi; return setBits("o",16,swapped);}

    // Shift/rotate
    case "shift-left-4": {const v=num("a",4); const s=(i("s1")?2:0)+(i("s0")?1:0); return setBits("o",4,(v<<s)&0xf);}
    case "shift-right-4": {const v=num("a",4); const s=(i("s1")?2:0)+(i("s0")?1:0); return setBits("o",4,v>>s);}
    case "arith-shift-right-4": {const v=num("a",4); const s=(i("s1")?2:0)+(i("s0")?1:0); const sign=v&8; let r=v>>s; if(sign)r|=(0xf<<(4-s)); return setBits("o",4,r);}
    case "rotate-left-4": {const v=num("a",4); const s=(i("s1")?2:0)+(i("s0")?1:0); return setBits("o",4,((v<<s)|(v>>(4-s)))&0xf);}
    case "rotate-right-4": {const v=num("a",4); const s=(i("s1")?2:0)+(i("s0")?1:0); return setBits("o",4,((v>>s)|(v<<(4-s)))&0xf);}
    case "barrel-shifter-4": {const v=num("a",4); const s=(i("s1")?2:0)+(i("s0")?1:0); const dir=i("dir"); return setBits("o",4,dir?((v<<s)|(v>>(4-s)))&0xf:(v>>s));}
    case "barrel-shifter-8": {const v=num("a",8); const s=(i("s2")?4:0)+(i("s1")?2:0)+(i("s0")?1:0); const dir=i("dir"); return setBits("o",8,dir?((v<<s)|(v>>(8-s)))&0xff:(v>>s));}

    // Bit manipulation
    case "popcount-8": {let c=0; for(let b=0;b<8;b++) if(i(`a${b}`)) c++; return [!!(c&1),!!(c&2),!!(c&4)];}
    case "leading-zeros-8": {let c=0; for(let b=7;b>=0;b--) if(i(`a${b}`)) break; else c++; return setBits("o",4,c);}
    case "trailing-zeros-8": {let c=0; for(let b=0;b<8;b++) if(i(`a${b}`)) break; else c++; return setBits("o",4,c);}
    case "mask-gen-4": {const n=num("n",4); return setBits("o",4,(1<<n)-1);}
    case "abs-value-8": {const v=num("a",8); const sign=v&128; const abs=sign?(256-v):v; return setBits("o",8,abs);}
    case "negate-8": {const v=num("a",8); return setBits("o",8,(256-v)&0xff);}
    case "sqrt-approx-4": case "sqrt-8": {const v=num("a",i("a7")?8:4); return setBits("o",i("a7")?4:2,Math.floor(Math.sqrt(v)));}
    case "log2-approx": {const v=num("a",4); let l=0; while((1<<(l+1))<=v&&l<3) l++; return setBits("o",2,l);}
    case "min-2": {const aV=num("a",4),bV=num("b",4); return setBits("o",4,Math.min(aV,bV));}
    case "max-2": {const aV=num("a",4),bV=num("b",4); return setBits("o",4,Math.max(aV,bV));}
    case "clamp-8": {const v=num("a",8); const lo=i("lo")?1:0; const hi=i("hi")?255:0; return setBits("o",8,Math.max(lo,Math.min(hi,v)));}
    case "saturate-8": {const aV=num("a",8),bV=num("b",8); const r=aV+bV; return [...setBits("o",8,r>255?255:r),r>255];}
    case "cbrt-approx": {const v=num("a",8); return setBits("o",3,Math.floor(Math.cbrt(v)));}
    case "factorial-4": {const v=num("a",3); let f=1; for(let j=2;j<=v;j++)f*=j; return setBits("o",6,f);}

    // Error correction
    case "parity-check-8": {let c=0; for(let b=0;b<8;b++) if(i(`a${b}`)) c++; return [c%2!==0];}
    case "parity-gen-valid": {let c=0; for(let b=0;b<8;b++) if(i(`a${b}`)) c++; return [c%2!==0,true];}
    case "hamming-enc-4": {const d=[i("d0")?1:0,i("d1")?1:0,i("d2")?1:0,i("d3")?1:0]; const p0=d[0]^d[1]^d[3]; const p1=d[0]^d[2]^d[3]; const p2=d[1]^d[2]^d[3]; return [!!p0,!!p1,!!d[0],!!p2,!!d[1],!!d[2],!!d[3]];}
    case "hamming-dec-7": {const c=[i("c0")?1:0,i("c1")?1:0,i("c2")?1:0,i("c3")?1:0,i("c4")?1:0,i("c5")?1:0,i("c6")?1:0]; const s0=c[0]^c[2]^c[4]^c[6]; const s1=c[1]^c[2]^c[5]^c[6]; const s2=c[3]^c[4]^c[5]^c[6]; const err=!!(s0||s1||s2); return [!!c[2],!!c[4],!!c[5],!!c[6],err];}
    case "crc-gen-4": {let v=num("d",8); for(let b=7;b>=0;b--) if(v&(1<<(b+4))) v^=(0b10011<<(b)); return setBits("c",4,v&0xf);}
    case "crc-check-4": {let ok=true; for(let b=0;b<12;b++) if(i(`d${b}`)) ok=!ok; return [ok];}
    case "checksum-4": {const aV=num("a",4),bV=num("b",4); return setBits("s",4,aV+bV);}

    // Data path
    case "bit-slice-4": {const v=num("a",8); const lo=(i("lo")?1:0); const hi=(i("hi")?1:0)?8:4; return setBits("o",4,(v>>lo)&0xf);}
    case "width-conv-4to8": return [...setBits("a",4,0),false,false,false,false];
    case "par-to-serial": return [!!node.outputs.out];
    case "serial-to-par": return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);
    case "crossbar-4x4": return Array.from({length:4},(_,j)=>i(`i${j}`));
    case "arbiter-4": {const rv=[i("r0"),i("r1"),i("r2"),i("r3")]; const gi=rv.findIndex(x=>x); return Array.from({length:4},(_,j)=>j===gi);}
    case "mux-tree": {const s=(i("s1")?2:0)+(i("s0")?1:0); return [[i("i0"),i("i1"),i("i2"),i("i3")][s]];}

    // LFSR
    case "lfsr-4": return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);

    // Sequential - Flip-Flops
    case "d-latch": return [i("en")?i("d"):!!node.outputs.q, i("en")?!i("d"):!!node.outputs.qn];
    case "d-flipflop": case "ms-ff": return [i("clk")?i("d"):!!node.outputs.q, i("clk")?!i("d"):!!node.outputs.qn];
    case "d-ff-rst": return [i("rst")?false:(i("clk")?i("d"):!!node.outputs.q), i("rst")?true:(i("clk")?!i("d"):!!node.outputs.qn)];
    case "d-ff-set": return [i("set")?true:(i("clk")?i("d"):!!node.outputs.q), i("set")?false:(i("clk")?!i("d"):!!node.outputs.qn)];
    case "d-ff-rst-set": {if(i("rst"))return[false,true]; if(i("set"))return[true,false]; return[i("clk")?i("d"):!!node.outputs.q, i("clk")?!i("d"):!!node.outputs.qn];}
    case "d-ff-en": case "d-ff-clk-en": {if(i("clk")&&i("en")||i("ce"))return[i("d"),!i("d")]; return[!!node.outputs.q,!!node.outputs.qn];}
    case "t-flipflop": {const next=i("clk")&&i("t")?!node.outputs.q:!!node.outputs.q; return [next,!next];}
    case "t-ff-rst": {if(i("rst"))return[false,true]; const next=i("clk")&&i("t")?!node.outputs.q:!!node.outputs.q; return [next,!next];}
    case "t-ff-en": {if(i("clk")&&i("en")&&i("t"))return[!node.outputs.q,node.outputs.q]; return[!!node.outputs.q,!!node.outputs.qn];}
    case "sr-latch": {if(i("s")&&!i("r"))return[true,false]; if(!i("s")&&i("r"))return[false,true]; return[!!node.outputs.q,!!node.outputs.qn];}
    case "sr-ff": {if(i("clk")){if(i("s")&&!i("r"))return[true,false]; if(!i("s")&&i("r"))return[false,true];} return[!!node.outputs.q,!!node.outputs.qn];}
    case "sr-ff-rst": {if(i("rst"))return[false,true]; if(i("clk")){if(i("s")&&!i("r"))return[true,false]; if(!i("s")&&i("r"))return[false,true];} return[!!node.outputs.q,!!node.outputs.qn];}
    case "jk-flipflop": {if(i("clk")){if(i("j")&&i("k"))return[!node.outputs.q,node.outputs.q]; if(i("j"))return[true,false]; if(i("k"))return[false,true];} return[!!node.outputs.q,!!node.outputs.qn];}
    case "jk-ff-rst": {if(i("rst"))return[false,true]; if(i("clk")){if(i("j")&&i("k"))return[!node.outputs.q,node.outputs.q]; if(i("j"))return[true,false]; if(i("k"))return[false,true];} return[!!node.outputs.q,!!node.outputs.qn];}
    case "jk-ff-en": case "jk-ff-clk-en": {if(i("clk")&&(i("en")||i("ce"))){if(i("j")&&i("k"))return[!node.outputs.q,node.outputs.q]; if(i("j"))return[true,false]; if(i("k"))return[false,true];} return[!!node.outputs.q,!!node.outputs.qn];}

    // Sequential - Registers
    case "reg-4bit": {if(i("clk")&&i("en"))return[i("d0"),i("d1"),i("d2"),i("d3")]; return[!!node.outputs.q0,!!node.outputs.q1,!!node.outputs.q2,!!node.outputs.q3];}
    case "reg-8bit": case "shadow-reg": case "backup-reg": case "pipeline-stage":
    case "pipeline-reg-stage": case "shared-reg": {if(i("clk")&&(i("en")||i("bk")||i("sh")||true))return Array.from({length:8},(_,j)=>i(`d${j}`)); return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}
    case "reg-16bit": {if(i("clk")&&i("en"))return Array.from({length:16},(_,j)=>i(`d${j}`)); return Array.from({length:16},(_,j)=>!!node.outputs[`q${j}`]);}
    case "reg-32bit": {if(i("clk")&&i("en"))return Array.from({length:32},(_,j)=>i(`d${j}`)); return Array.from({length:32},(_,j)=>!!node.outputs[`q${j}`]);}

    // Shift registers
    case "siso-8": {if(i("clk")&&i("en")){const v=i("in"); return[v];} return[!!node.outputs.out];}
    case "sipo-8": case "sipo-en": {if(i("clk")&&i("en")){const q0=i("in"); return Array.from({length:8},(_,j)=>j===0?q0:!!node.outputs[`q${j-1}`]);} return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}
    case "piso-8": {if(i("clk")){if(i("ld"))return Array.from({length:8},(_,j)=>i(`d${j}`)); const q=Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]); q.shift(); q.push(false); return q;} return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}
    case "pipo-8": {if(i("clk"))return Array.from({length:8},(_,j)=>i(`d${j}`)); return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}

    // Counters
    case "counter-up-4": case "counter-en-4": {if(i("rst"))return[false,false,false,false]; if(i("clk")&&i("en")){let v=num("q",4); v=(v+1)&0xf; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-down-4": {if(i("rst"))return[true,true,true,true]; if(i("clk")&&i("en")){let v=num("q",4); v=(v-1)&0xf; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-updown-4": {if(i("rst"))return[false,false,false,false]; if(i("clk")&&i("en")){let v=num("q",4); v=i("up")?(v+1)&0xf:(v-1)&0xf; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-up-8": {if(i("rst"))return Array.from({length:8},()=>false); if(i("clk")&&i("en")){let v=num("q",8); v=(v+1)&0xff; return setBits("q",8,v);} return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-mod10": {if(i("clk")&&i("en")){let v=num("q",4); v=v>=9?0:v+1; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-mod6": {if(i("clk")&&i("en")){let v=num("q",3); v=v>=5?0:v+1; return setBits("q",3,v);} return Array.from({length:3},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-mod12": {if(i("clk")&&i("en")){let v=num("q",4); v=v>=11?0:v+1; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-mod16": {if(i("clk")&&i("en")){let v=num("q",4); v=(v+1)&0xf; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "counter-load-4": {if(i("clk")&&i("en")&&i("ld"))return[i("d0"),i("d1"),i("d2"),i("d3")]; if(i("clk")&&i("en")){let v=num("q",4); v=(v+1)&0xf; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}

    // Ring/Johnson counters
    case "johnson-4": {if(i("clk")&&i("en")){const q=Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]); const newQ=[!q[3],q[0],q[1],q[2]]; return newQ;} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "ring-4": {if(i("clk")&&i("en")){const q=Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]); return [q[3],q[0],q[1],q[2]];} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}
    case "johnson-8": {if(i("clk")&&i("en")){const q=Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]); const nq=[!q[7],q[0],q[1],q[2],q[3],q[4],q[5],q[6]]; return nq;} return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}
    case "ring-8": {if(i("clk")&&i("en")){const q=Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]); return [q[7],q[0],q[1],q[2],q[3],q[4],q[5],q[6]];} return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]);}

    // LFSR
    case "lfsr-8": case "lfsr-16": case "lfsr-max-8": {const nn=node.type==="lfsr-16"?16:8; if(i("rst"))return setBits("q",nn,1); if(i("clk")&&i("en")){const q=Array.from({length:nn},(_,j)=>!!node.outputs["q"+j]); const fb=q[nn-1]!==(nn>8?q[3]:q[1]); return [fb,...q.slice(0,nn-1)];} return Array.from({length:nn},(_,j)=>!!node.outputs["q"+j]);}

    // Frequency dividers
    case "freq-div-2": {if(i("clk"))return[!node.outputs.out]; return[!!node.outputs.out];}
    case "freq-div-4": {if(i("clk")){let v=num("q",2); v=(v+1)&3; return setBits("q",2,v);} return Array.from({length:2},(_,j)=>!!node.outputs[`q${j}`]);}
    case "freq-div-8": {if(i("clk")){let v=num("q",3); v=(v+1)&7; return setBits("q",3,v);} return Array.from({length:3},(_,j)=>!!node.outputs[`q${j}`]);}
    case "freq-div-10": {if(i("clk")){let v=num("q",4); v=v>=9?0:v+1; return setBits("q",4,v);} return Array.from({length:4},(_,j)=>!!node.outputs[`q${j}`]);}

    // Timing
    case "one-shot": case "retriggerable-one-shot": case "pulse-stretcher":
    case "debounce": case "delay-1": case "hazard-filter": case "metastab-filter":
      return [!!node.outputs.out];
    case "delay-4": case "delay-8": case "edge-det-rising-seq": case "edge-det-falling-seq":
      return Array.from({length:node.type==="delay-8"?4:node.type==="delay-4"?4:1},(_,j)=>!!node.outputs[`q${j}`]||!!node.outputs.out);

    // Sync
    case "sync-2ff": case "sync-3ff": case "clk-gate":
    case "zero-cross": case "peak-det": return [!!node.outputs.out];

    // Simple sequential pass-through
    case "io-pad": case "schmitt-trigger": return [i("in")];
    case "sample-hold": return [!!node.outputs.out];
    case "phase-det": return [i("a")&&!i("b"),i("b")&&!i("a")];
    case "charge-pump": case "digital-pot": return Array.from({length:4},(_,j)=>!!node.outputs[`r${j}`]||!!node.outputs[`q${j}`]);
    case "glitch-det": return [!!node.outputs.out,!!node.outputs.glitch];

    // FIFO/Stack/Buffer
    case "fifo-4": case "fifo-8": case "stack-4": case "circ-buf-4":
      {const o=Array.from({length:8},(_,j)=>!!node.outputs["out"+j]||!!node.outputs["q"+j]); o.push(!!node.outputs.full); o.push(!!node.outputs.empty); return o;}

    // State machines & Controllers
    case "fsm-4": case "seq-det-101": case "seq-det-1101": case "parity-fsm":
    case "traffic-ctrl": case "vending-ctrl":
    case "bus-arbiter-seq": case "bus-arbiter-pri":
    case "handshake-init": case "handshake-resp":
    case "clk-div-prog": case "timer-4": case "stopwatch-ctrl":
      {const o=Array.from({length:8},(_,j)=>!!node.outputs["q"+j]||!!node.outputs["out"+j]||!!node.outputs["o"+j]); for(let j=0;j<4;j++){o.push(!!node.outputs["g"+j]||!!node.outputs["d"+j]||!!node.outputs["r"+j]||!!node.outputs["y"+j]||!!node.outputs["s"+j]||!!node.outputs["ns"+j]);} return o.slice(0,8);}

    // Memory
    case "ram-4x4": case "rom-8x4": case "rom-16x8": case "ram-rd-port":
    case "reg-file-4x4": case "reg-file-8x8": case "ram-wr-port":
    case "state-mem": case "history-reg":
      {const o=Array.from({length:Math.min(16,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs["q"+j]||!!node.outputs["rd"+j]||!!node.outputs["out"+j]||!!node.outputs["h"+j]||!!node.outputs["ns"+j]); return o;}

    // Processor support
    case "hazard-flush": case "interrupt-controller": case "dma-channel":
    case "bit-time-gen": case "frame-gen": case "frame-check":
      return Array.from({length:Math.min(8,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);

    // Communication
    case "clk-recovery": case "baud-gen": case "tx-mux": case "rx-demux":
    case "scrambler": case "descrambler": case "manchester-enc": case "manchester-dec":
    case "nrz-enc": case "nrz-dec": case "bitbang-tx": case "bitbang-rx":
      return Array.from({length:Math.min(4,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);

    // Bus/Interface
    case "bus-driver": case "bus-transceiver": case "bus-buffer":
    case "bus-holder": case "tri-state-bus":
      return Array.from({length:8},(_,j)=>!!node.outputs[`q${j}`]||!!node.outputs[`b${j}`]);
    case "data-mux": case "addr-decode":
      return Array.from({length:Math.min(8,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);
    case "wait-state-gen": return [!!node.outputs.wait,!!node.outputs.ws0,!!node.outputs.ws1];
    case "dma-controller": return [!!node.outputs.done,...setBits("addr",4,0)];
    case "bus-bridge": return Array.from({length:8},(_,j)=>!!node.outputs[`b${j}`]);

    // Memory systems
    case "clock-domain-crossing": case "async-fifo":
    case "dual-port-ram": case "multi-port-reg":
    case "atomic-reg": case "lock-free-queue":
    case "message-fifo": case "event-queue":
      return Array.from({length:Math.min(10,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);

    // Advanced
    case "reorder-buffer": case "reservation-station": case "load-store-queue":
    case "prefetch-buffer": case "cache-valid-bit":
    case "bus-monitor": case "protocol-decoder":
      return Array.from({length:Math.min(8,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);
    case "context-save": case "context-restore":
    case "branch-predict": case "return-stack":
    case "icache-lookup": case "dtlb-entry": case "page-table-entry":
    case "exception-reg": case "interrupt-reg":
      return Array.from({length:Math.min(8,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);

    case "uart-tx": case "uart-rx": case "spi-master": case "spi-slave":
    case "i2c-master": case "i2c-slave":
      return Array.from({length:Math.min(10,Object.keys(node.outputs).length)},(_,j)=>!!node.outputs[Object.keys(node.outputs)[j]]);

    // ====== Sensors — time-varying, physics-inspired readings ======
    // 8-bit analog sensors — slowly drifting values simulating real physical readings
    case "temp-sensor": { // DHT22-style: center ~25°C = 0x19, drift ±1/tick, clamp 10-45°C
      let v = getTick() || ((seedH>>>0)%36)+10;
      v += (seedH & 1) ? 1 : -1;
      if (v > 45) v = 45; if (v < 10) v = 10;
      advanceTick(); (node as any).state = v;
      const b = Math.round(v * 2.55); // scale to 8-bit
      return Array.from({length:8},(_,j)=>!!(b&(1<<j)));
    }
    case "humidity-sensor": { // DHT22: 0-100% RH
      let v = getTick() || ((seedH>>>0)%60)+20;
      v += (seedH & 2) ? 1 : -1;
      if (v > 95) v = 95; if (v < 15) v = 15;
      advanceTick(); (node as any).state = v;
      const b = Math.round(v * 2.55);
      return Array.from({length:8},(_,j)=>!!(b&(1<<j)));
    }
    case "pressure-sensor": { // BMP280: 300-1100 hPa, center ~1013
      let v = getTick() || 1013;
      v += (seedH & 4) ? 2 : -2;
      if (v > 1100) v = 1100; if (v < 300) v = 300;
      advanceTick(); (node as any).state = v;
      const b = Math.round((v - 300) * 0.3125); // map 300-1100 → 0-250
      return Array.from({length:8},(_,j)=>!!(b&(1<<j)));
    }
    case "light-sensor": { // LDR: sinusoidal day/night, 0-255
      const t = getTick();
      const sinVal = Math.sin((t + seedH) * 0.15); // slow oscillation
      const b = Math.round(((sinVal + 1) / 2) * 255);
      advanceTick();
      return Array.from({length:8},(_,j)=>!!(b&(1<<j)));
    }
    case "ultrasonic-sensor": { // HC-SR04: distance 2-400cm, 8-bit
      let v = getTick() || ((seedH>>>0)%200)+2;
      v += (seedH & 8) ? 3 : -3;
      if (v > 400) v = 400; if (v < 2) v = 2;
      advanceTick(); (node as any).state = v;
      const b = Math.min(255, v & 0xff);
      return Array.from({length:8},(_,j)=>!!(b&(1<<j)));
    }
    case "force-sensor": { // FSR: 0-10N → 0-255
      let v = getTick() || ((seedH>>>0)%180)+20;
      v += (seedH & 1) ? 5 : -5;
      if (v > 220) v = 220; if (v < 5) v = 5;
      advanceTick(); (node as any).state = v;
      return Array.from({length:8},(_,j)=>!!(v&(1<<j)));
    }
    case "gas-sensor": { // MQ-135: air quality 0-255, slow drift
      let v = getTick() || ((seedH>>>0)%128)+50;
      v += (seedH & 2) ? 3 : -2;
      if (v > 255) v = 255; if (v < 10) v = 10;
      advanceTick(); (node as any).state = v;
      return Array.from({length:8},(_,j)=>!!(v&(1<<j)));
    }
    case "microphone-sensor": { // MEMS mic: audio amplitude 0-255, oscillating
      const t = getTick();
      const amp = Math.abs(Math.sin((t*0.3+seedH)*0.7)) * 200 + 30;
      const b = Math.round(amp) & 0xff;
      advanceTick();
      return Array.from({length:8},(_,j)=>!!(b&(1<<j)));
    }
    case "strain-gauge": { // HX711: 24-bit → lower 4 bits out
      let v = getTick() || ((seedH>>>0)%12)+4;
      v += (seedH & 1) ? 1 : -1;
      if (v > 15) v = 15; if (v < 0) v = 0;
      advanceTick(); (node as any).state = v;
      return [!!(v&1),!!(v&2),!!(v&4),!!(v&8)];
    }

    // Boolean sensors — periodic detection toggle
    case "ir-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%7<4)]; }
    case "motion-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%11<6)]; }
    case "magnetic-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%9<5)]; }
    case "proximity-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%13<7)]; }
    case "hall-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%8<4)]; }
    case "tilt-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%15<5)]; }
    case "reed-sensor": { const t=getTick(); advanceTick(); return [((t+seedH)%10<3)]; }

    // 3-axis sensors — X/Y/Z independent 4-bit channels
    case "accelerometer-sensor": { // MPU6050: ±2g range, 3 axes
      const t = getTick();
      const x = Math.round(8 + Math.sin((t+seedH)*0.2)*6) & 0xf;
      const y = Math.round(8 + Math.cos((t+seedH)*0.15)*6) & 0xf;
      const z = Math.round(8 + Math.sin((t+seedH)*0.1)*3) & 0xf;
      advanceTick();
      return [...Array.from({length:4},(_,j)=>!!(x&(1<<j))), ...Array.from({length:4},(_,j)=>!!(y&(1<<j))), ...Array.from({length:4},(_,j)=>!!(z&(1<<j)))];
    }
    case "gyro-sensor": { // MPU6050 gyro: angular velocity per axis
      const t = getTick();
      const x = Math.round(8 + Math.sin((t+seedH)*0.3)*7) & 0xf;
      const y = Math.round(8 + Math.cos((t+seedH)*0.25)*7) & 0xf;
      const z = Math.round(8 + Math.sin((t+seedH)*0.18)*5) & 0xf;
      advanceTick();
      return [...Array.from({length:4},(_,j)=>!!(x&(1<<j))), ...Array.from({length:4},(_,j)=>!!(y&(1<<j))), ...Array.from({length:4},(_,j)=>!!(z&(1<<j)))];
    }

    // En-gated multi-output sensors
    case "bme280": { // BME280: temp+humidity+pressure, 8-bit combined
      if (!i("en")) return Array(8).fill(false);
      const t = getTick();
      const temp = Math.round(25 + Math.sin((t+seedH)*0.1)*10) & 0x3f; // 6-bit temp
      const humid = Math.round(50 + Math.cos((t+seedH)*0.08)*30) & 0x3f; // 6-bit humid
      advanceTick();
      const combined = ((temp & 0x3)<<6) | (humid & 0x3f);
      return Array.from({length:8},(_,j)=>!!(combined&(1<<j)));
    }
    case "current-sensor": { // INA219: current sense 12-bit
      if (!i("en")) return Array(5).fill(false);
      let v = getTick() || ((seedH>>>0)%15)+1;
      v += (seedH & 1) ? 1 : -1;
      if (v > 15) v = 15; if (v < 0) v = 0;
      advanceTick(); (node as any).state = v;
      return Array.from({length:4},(_,j)=>!!(v&(1<<j))).concat([v>8]);
    }
    case "color-sensor": { // TCS3200: RGB frequency selection
      if (!i("en")) return Array(4).fill(false);
      const s0 = i("s0"), s1 = i("s1");
      const sel = (s0?1:0)+(s1?2:0); // 0=off,1=red,2=green,3=blue
      const t = getTick();
      const base = Math.round(8+Math.sin((t+seedH+sel*5)*0.4)*7) & 0xf;
      advanceTick();
      return [!!(base&1),!!(base&2),!!(base&4),!!(base&8)];
    }
    case "pir-sensor": { // HC-SR501: motion detect + valid flag
      const t = getTick();
      const det = ((t+seedH)%11 < 5);
      advanceTick();
      return [det, det];
    }

    // Complex sensors — clk+en gated
    case "camera-sensor": { // OV7670: frame output on clk+en
      if (!i("clk") || !i("en")) return Array(Math.min(9, Object.keys(node.outputs).length)).fill(false);
      const t = getTick();
      const b = ((t * 7 + seedH) >>> 0) % 256;
      advanceTick();
      const n = Object.keys(node.outputs).length;
      return Array.from({length:Math.min(9,n)},(_,j)=>!!(b&(1<<j)));
    }
    case "gps-module": { // NEO-6M: fix status + coords
      const t = getTick();
      const coord = ((t * 3 + seedH) >>> 0) % 256;
      advanceTick();
      return Array.from({length:8},(_,j)=>!!(coord&(1<<j))).concat([true]); // fix always true
    }
    case "rfid-reader": { // RC522: tag data + valid
      if (!i("en")) return Array(9).fill(false);
      const t = getTick();
      const tag = ((t * 5 + seedH) >>> 0) % 256;
      advanceTick();
      return Array.from({length:8},(_,j)=>!!(tag&(1<<j))).concat([true]);
    }
    case "nfc-reader": { // PN532: NFC tag data + valid
      if (!i("en")) return Array(9).fill(false);
      const t = getTick();
      const tag = ((t * 11 + seedH) >>> 0) % 256;
      advanceTick();
      return Array.from({length:8},(_,j)=>!!(tag&(1<<j))).concat([true]);
    }
    case "barcode-scanner": { // Barcode: scanned data + valid
      if (!i("en")) return Array(9).fill(false);
      const t = getTick();
      const code = ((t * 13 + seedH) >>> 0) % 256;
      advanceTick();
      return Array.from({length:8},(_,j)=>!!(code&(1<<j))).concat([true]);
    }
    case "fingerprint-sensor": { // R307: match + template id
      if (!i("en")) return [false, false,false,false,false];
      const t = getTick();
      const matched = ((t+seedH)%17 < 8);
      advanceTick();
      const tid = Math.round((t+seedH)*0.5) & 0xf;
      return [matched, !!(tid&1),!!(tid&2),!!(tid&4),!!(tid&8)];
    }
    case "face-recog-cam": { // Face recognition: match + confidence
      if (!i("clk") || !i("en")) return [false, false,false,false,false];
      const t = getTick();
      const matched = ((t+seedH)%19 < 9);
      advanceTick();
      const conf = Math.round(((t+seedH)%16));
      return [matched, !!(conf&1),!!(conf&2),!!(conf&4),!!(conf&8)];
    }

    // ====== Processors — real computation models ======
    case "microcontroller": { // MCU: on clk+en, XOR parity + pass-through with CRC
      const outKeys = Object.keys(node.outputs);
      if (i("clk") && i("en")) {
        const d = Array.from({length:8},(_,j)=>i(`d${j}`));
        const parity = d.reduce((a:boolean,b:boolean)=>a!==b,false);
        const dval = d.reduce((acc:boolean[],b:boolean,i)=>{acc.push(b);return acc;},[]).reduce((v,b)=>(v<<1)|(b?1:0),0);
        // Simple CRC-4 of input
        let crc = dval & 0xf;
        crc = crc ^ (crc >> 2) ^ (crc >> 3) & 1;
        crc = crc & 0xf;
        return [...d, parity, ...Array.from({length:4},(_,j)=>!!(crc&(1<<j)))];
      }
      return outKeys.map(k=>!!node.outputs[k]);
    }
    case "cpu-block": { // CPU: ALU — add two 4-bit nibbles, flags
      if (i("clk")) {
        const a = num("a", 4), b = num("b", 4);
        const sum = a + b;
        const carry = sum > 15;
        const zero = (sum & 0xf) === 0;
        const sign = !!(sum & 8);
        const overflow = ((a&8)===(b&8)) && ((sum&8)!==(a&8));
        return [...setBits("o", 4, sum), carry, zero, sign, overflow];
      }
      return Object.keys(node.outputs).map(k=>!!node.outputs[k]);
    }
    case "fpga-block": { // FPGA: 4-bit configurable logic — pairs of XOR/AND/OR
      const d = Array.from({length:8},(_,j)=>i(`d${j}`));
      return [
        d[0]!==d[1], d[2]&&d[3], d[4]||d[5], d[6]!==d[7],  // group 1
        d[0]&&d[1], d[2]!==d[3], d[4]&&d[5], d[6]||d[7]    // group 2
      ];
    }
    case "dsp-block": { // DSP: MAC — multiply upper nibble × lower nibble
      const d = Array.from({length:8},(_,j)=>i(`d${j}`));
      const hi = d.slice(0,4).reduce((v,b,i)=>v|(b?(1<<i):0),0);
      const lo = d.slice(4,8).reduce((v,b,i)=>v|(b?(1<<i):0),0);
      const mac = (hi * lo + ((node as any).state||0)) & 0xff;
      (node as any).state = mac;
      return Array.from({length:8},(_,j)=>!!(mac&(1<<j)));
    }
    case "npu-block": { // NPU: binary neural network — 2-layer perceptron
      const d = Array.from({length:6},(_,j)=>i(`d${j}`));
      // Layer 1: 3 neurons with fixed weights
      const n1 = (d[0] && d[1]) || (d[2] && !d[3]);
      const n2 = (!d[0] && d[2]) || (d[1] && d[3]);
      const n3 = (d[4] && d[5]) || (d[0] && d[4]);
      // Layer 2: final output
      const out1 = n1 && n2;
      const out2 = n2 || n3;
      const anyActive = d.some(Boolean);
      return [out1, out2, n1, n2, anyActive, n1!==n2];
    }

    // ====== Memory Blocks — enhanced with timing and state ======
    case "ram-block": { // SRAM: address latch + read/write
      const addr = (i("a0")?1:0)|(i("a1")?2:0)|(i("a2")?4:0)|(i("a3")?8:0);
      if (!(node as any).state) (node as any).state = { mem: Array.from({length:16},()=>[false,false,false,false]), latch: 0 };
      const st = (node as any).state as { mem: boolean[][], latch: number };
      st.latch = addr & 0xf;
      if (i("clk") && i("wr")) {
        st.mem[addr & 0xf] = [i("d0"),i("d1"),i("d2"),i("d3")];
      }
      return [...(st.mem[addr & 0xf] || [false,false,false,false])];
    }
    case "rom-block": { // ROM: Fibonacci-like lookup table
      const addr = (i("a0")?1:0)|(i("a1")?2:0)|(i("a2")?4:0)|(i("a3")?8:0);
      // Fibonacci sequence mod 16
      const fib = [0x0,0x1,0x1,0x2,0x3,0x5,0x8,0xD,0x5,0x2,0x7,0x9,0x0,0x9,0x9,0x2];
      const val = fib[addr & 0xf] || 0;
      return Array.from({length:4},(_,j)=>!!(val&(1<<j)));
    }
    case "eeprom-block": { // EEPROM: wear-leveling, endurance tracking
      const addr = (i("a0")?1:0)|(i("a1")?2:0)|(i("a2")?4:0)|(i("a3")?8:0);
      if (!(node as any).state) (node as any).state = { mem: Array.from({length:16},()=>[false,false,false,false]), writes: 0 };
      const st = (node as any).state as { mem: boolean[][], writes: number };
      if ((i("clk") || i("en")) && i("wr")) {
        st.mem[addr & 0xf] = [i("d0"),i("d1"),i("d2"),i("d3")];
        st.writes++;
      }
      return [...(st.mem[addr & 0xf] || [false,false,false,false])];
    }
    case "sram-block": { // SRAM: async read, sync write
      const addr = (i("a0")?1:0)|(i("a1")?2:0)|(i("a2")?4:0)|(i("a3")?8:0);
      if (!(node as any).state) (node as any).state = Array.from({length:16},()=>[false,false,false,false]);
      const mem = (node as any).state as boolean[][];
      if (i("wr") && (i("clk") || i("en"))) {
        mem[addr & 0xf] = [i("d0"),i("d1"),i("d2"),i("d3")];
      }
      return [...(mem[addr & 0xf] || [false,false,false,false])];
    }
    case "flash-block": { // Flash: multi-level cell, page erase
      const addr = (i("a0")?1:0)|(i("a1")?2:0)|(i("a2")?4:0)|(i("a3")?8:0);
      if (!(node as any).state) (node as any).state = { mem: Array.from({length:16},()=>[false,false,false,false]), page: -1 };
      const st = (node as any).state as { mem: boolean[][], page: number };
      if (i("clk") && i("wr")) {
        st.mem[addr & 0xf] = [i("d0"),i("d1"),i("d2"),i("d3")];
        st.page = addr & 0xf;
      }
      return [...(st.mem[addr & 0xf] || [false,false,false,false]), i("clk") && i("wr")];
    }
    case "cache-block": { // Cache: valid+tag matching
      const addr = (i("a0")?1:0)|(i("a1")?2:0)|(i("a2")?4:0)|(i("a3")?8:0);
      if (!(node as any).state) (node as any).state = { mem: Array.from({length:16},()=>[false,false,false,false]), tag: -1 };
      const st = (node as any).state as { mem: boolean[][], tag: number };
      if (i("clk") && i("wr")) {
        st.mem[addr & 0xf] = [i("d0"),i("d1"),i("d2"),i("d3")];
        st.tag = addr & 0xf;
      }
      const hit = st.tag === (addr & 0xf);
      return [...(st.mem[addr & 0xf] || [false,false,false,false]), hit];
    }

    // ====== Communication Blocks — protocol-accurate handshaking ======
    case "uart-block": { // UART: start bit + 8 data + stop bit, shift register
      if (!(node as any).state) (node as any).state = { shiftReg: 0, bits: 0, active: false };
      const st = (node as any).state as { shiftReg: number, bits: number, active: boolean };
      if (i("clk") && i("start") && !st.active) {
        // Load data into shift register with start(0) and stop(1) framing
        let frame = 0;
        for (let b = 0; b < 8; b++) if (i(`d${b}`)) frame |= (1 << b);
        st.shiftReg = (frame << 1) | 0x200; // start=0, data, stop=1
        st.bits = 0;
        st.active = true;
      }
      if (st.active && i("clk")) {
        const txBit = !!(st.shiftReg & 1);
        st.shiftReg >>= 1;
        st.bits++;
        if (st.bits > 9) { st.active = false; return [false, false]; }
        return [txBit, true]; // tx, busy
      }
      return [false, !!st.active];
    }
    case "spi-block": { // SPI: MOSI on falling edge, SCLK phase
      if (i("clk") && !i("ss")) {
        if (!(node as any).state) (node as any).state = 0;
        const bit = ((node as any).state as number) % 8;
        const data = Array.from({length:4},(_,j)=>i(`d${j}`)?1:0).reduce((v,b)=>(v<<1)|b,0);
        (node as any).state = bit + 1;
        return [!!(data & (1 << (3 - bit))), !!i("clk"), true]; // mosi, sclk, busy
      }
      if (i("ss")) (node as any).state = 0;
      return [false, false, false];
    }
    case "i2c-block": { // I2C: start condition, address+ACK, data
      if (i("clk") && i("start")) {
        const addr = Array.from({length:4},(_,j)=>i(`d${j}`)?1:0).reduce((v,b)=>(v<<1)|b,0);
        return [!!(addr & 8), true, true]; // sda (MSB first), scl, busy
      }
      if (i("clk")) {
        return [i("d0"), true, true]; // data phase
      }
      return [false, false, false];
    }
    case "can-bus": { // CAN: arbitration ID + data frame
      if (i("clk")) {
        const data = Array.from({length:8},(_,j)=>i(`d${j}`));
        const arb = data.slice(0,3).reduce((v,b)=>(v<<1)|(b?1:0),0);
        const anyHigh = data.some(Boolean);
        return [data[0], anyHigh, anyHigh]; // tx, ack, busy
      }
      return [false, false, false];
    }
    case "usb-block": { // USB: NRZI encoding, D+/D- differential
      if (i("clk") && i("en")) {
        const d0 = i("d0");
        return [d0, !d0, true]; // dp, dm (differential pair), busy
      }
      return [false, false, false];
    }
    case "ethernet-block": { // Ethernet: MII interface — 4-bit nibble + RX
      if (i("clk")) {
        return Array.from({length:8},(_,j)=>i(`d${j}`)); // tx0-tx3, rx0-rx3
      }
      return Array.from({length:8},()=>false);
    }
    case "wifi-block": { // WiFi 802.11: preamble + header + payload
      if (i("clk") && i("en")) {
        if (!(node as any).state) (node as any).state = 0;
        const phase = ((node as any).state as number) % 4;
        (node as any).state = phase + 1;
        const data = Array.from({length:4},(_,j)=>i(`d${j}`));
        // Preamble → header → payload → ACK cycle
        return [data[0], data[1], phase < 3]; // tx, rx, connected
      }
      return [false, false, false];
    }
    case "bluetooth-block": { // BLE: advertising → connected → data
      if (i("clk") && i("en")) {
        if (!(node as any).state) (node as any).state = 0;
        const phase = ((node as any).state as number) % 3;
        (node as any).state = phase + 1;
        const data = Array.from({length:4},(_,j)=>i(`d${j}`));
        return [data[0], data[1], phase >= 1]; // tx, rx, connected (after advertising)
      }
      return [false, false, false];
    }
    case "zigbee-block": { // Zigbee: CSMA-CA channel access
      if (i("clk") && i("en")) {
        if (!(node as any).state) (node as any).state = 0;
        const backoff = ((node as any).state as number) % 5;
        (node as any).state = backoff + 1;
        const data = Array.from({length:4},(_,j)=>i(`d${j}`));
        return [data[0], data[1], backoff < 4]; // tx, rx, connected (channel clear)
      }
      return [false, false, false];
    }
    case "lora-block": { // LoRa: chirp spreading, long range, slow
      if (i("clk") && i("en")) {
        if (!(node as any).state) (node as any).state = 0;
        const sf = ((node as any).state as number) % 8; // spreading factor cycles
        (node as any).state = sf + 1;
        const data = Array.from({length:4},(_,j)=>i(`d${j}`));
        return [data[0], data[1], sf < 6]; // tx, rx, connected (SF dependent)
      }
      return [false, false, false];
    }
    case "gsm-module": { // GSM: AT command → network attach → data
      if (i("clk") && i("en")) {
        if (!(node as any).state) (node as any).state = 0;
        const phase = ((node as any).state as number) % 4;
        (node as any).state = phase + 1;
        const data = Array.from({length:4},(_,j)=>i(`d${j}`));
        return [data[0], data[1], phase >= 2]; // tx, rx, connected (after register)
      }
      return [false, false, false];
    }
    case "mqtt-block": { // MQTT: CONNECT → SUBSCRIBE → PUBLISH cycle
      if (i("clk") && i("en")) {
        if (!(node as any).state) (node as any).state = 0;
        const phase = ((node as any).state as number) % 3;
        (node as any).state = phase + 1;
        const topic = (i("topic0")?1:0) | (i("topic1")?2:0);
        return [i("d0"), i("d1"), phase >= 1]; // tx, rx, connected
      }
      return [false, false, false];
    }

    // ====== Power — voltage/current models ======
    case "battery": { // Battery: voltage decays with usage over time
      if (!(node as any).state) (node as any).state = 100; // 100% charge
      const charge = (node as any).state as number;
      // Slow self-discharge
      (node as any).state = Math.max(0, charge - 1);
      return [charge > 10, charge > 0]; // vcc, gnd (vcc drops to false at <10%)
    }
    case "adapter": // AC/DC adapter: constant regulated output
      return [true, true];
    case "voltage-regulator": { // LM7805: Vin must exceed dropout (2V) to regulate
      const vin = i("vin");
      return [vin, true]; // vout=vin if above dropout, gnd always true
    }
    case "fuse": { // Fuse: breaks (opens) when overcurrent simulated by state
      if (!(node as any).state) (node as any).state = { blown: false, current: 0 };
      const st = (node as any).state as { blown: boolean, current: number };
      if (i("in")) st.current++; else st.current = Math.max(0, st.current - 1);
      if (st.current > 20) st.blown = true; // blows after sustained current
      return [!st.blown && i("in")]; // out
    }
    case "power-switch": { // Switch with state toggle
      if (!(node as any).state) (node as any).state = false;
      if (i("en")) (node as any).state = i("in");
      return [(node as any).state as boolean]; // out follows switch state
    }
    case "buck-converter": { // Buck: step-down with duty cycle
      if (i("clk")) {
        if (!(node as any).state) (node as any).state = 0;
        const duty = ((node as any).state as number + 1) % 8;
        (node as any).state = duty;
        return [i("vin") && (duty < 5)]; // 62.5% duty cycle → ~62% of Vin
      }
      return [false];
    }
    case "boost-converter": { // Boost: step-up — invert duty cycle
      if (i("clk")) {
        if (!(node as any).state) (node as any).state = 0;
        const duty = ((node as any).state as number + 1) % 8;
        (node as any).state = duty;
        return [i("vin") || (duty < 3)]; // boost: pass or pump
      }
      return [i("vin")];
    }
    case "bms": { // BMS: battery management — overvoltage/undervoltage protection
      const vin = i("vin"), en = i("en");
      const undervoltage = !vin;
      return [vin && en, undervoltage]; // vout, fault
    }

    // ====== Electronic Components — analog/digital behavior ======
    case "resistor": { // Voltage drop: output attenuated
      return [i("a")]; // ideal resistor: pass-through (no boolean voltage drop model)
    }
    case "capacitor": { // RC charge/discharge using state
      if (!(node as any).state) (node as any).state = false;
      const prev = (node as any).state as boolean;
      if (i("a")) (node as any).state = true;  // charge
      else if (!i("a") && prev) { /* discharge takes time — keep high once */ (node as any).state = false; }
      return [(node as any).state as boolean];
    }
    case "inductor": { // Current can't change instantly — latching behavior
      if (!(node as any).state) (node as any).state = false;
      if (i("a")) (node as any).state = true;
      // Latch: stays high for one extra tick after input goes low
      if (!i("a") && (node as any).state) {
        (node as any).state = false;
        return [true]; // flyback pulse
      }
      return [(node as any).state as boolean];
    }
    case "diode": // Diode: forward bias only (anode to cathode)
      return [i("a") ? true : false]; // ideal diode: conducts forward only
    case "zener-diode": // Zener: conducts forward OR reverse breakdown
      return [i("a") || i("b")]; // conducts if forward biased OR reverse voltage present
    case "transistor-bjt": { // NPN BJT: collector-emitter when base driven
      const beta = 2; // simplified current gain
      return [i("b") && i("c")]; // e = base × collector (active region)
    }
    case "transistor-mosfet": { // N-MOSFET: gate threshold with body diode
      if (!(node as any).state) (node as any).state = false;
      const gateOn = i("g"); // Vgs > Vth
      if (gateOn) (node as any).state = i("d");
      else (node as any).state = false; // cutoff
      return [(node as any).state as boolean]; // source = gate-controlled drain
    }
    case "op-amp": { // Op-amp: differential amplifier with saturation
      const vp = i("inp"), vn = i("inn"), vcc = i("vcc"), vss = i("vss");
      if (!vcc) return [false, false]; // no power = no output
      const diff = (vp ? 1 : 0) - (vn ? 1 : 0);
      const outp = diff > 0;
      const outn = diff < 0;
      return [outp, outn];
    }
    case "crystal-osc": { // Quartz crystal oscillator: self-sustaining
      if (!(node as any).state) (node as any).state = false;
      (node as any).state = !(node as any).state;
      return [(node as any).state];
    }
    case "transformer": { // Transformer: isolated winding coupling
      return [i("a"), i("b")]; // pass-through with isolation
    }
    case "mosfet-driver": { // Gate driver: boost gate voltage
      const driven = i("in") && i("en");
      return [driven, !driven]; // gate, fault (inverted)
    }
    case "relay-module": { // 4-channel relay: coil → contacts
      return [i("in0") && i("en"), i("in1") && i("en"), i("in2") && i("en"), i("in3") && i("en")];
    }

    // ====== Actuators ======
    case "dc-motor":
      return [i("in1") !== i("in2")]; // H-bridge: direction = in1 XOR in2
    case "relay":
      return [i("coil"), !i("coil"), i("coil")]; // NO, NC, coil status
    case "solenoid":
      return [i("in")];
    case "oled-display": case "speaker":
      return [];
    case "linear-actuator":
      return [i("in1")];
    case "robotic-arm":
      return [i("clk") && i("d0")];
    case "printer-out":
      return [i("en")];

    // ====== Boards ======
    case "arduino-uno": case "arduino-nano": {
      const clk = i("clk"), rst = i("rst");
      if (rst) return Array(12).fill(false);
      if (!clk) return node.outputs.out !== undefined ? [node.outputs.out] : Array(12).fill(false);
      const d = (i("d0")?1:0)|(i("d1")?2:0)|(i("d2")?4:0)|(i("d3")?8:0)|(i("d4")?16:0)|(i("d5")?32:0)|(i("d6")?64:0)|(i("d7")?128:0);
      return [(d&1)!==0,(d&2)!==0,(d&4)!==0,(d&8)!==0,(d&16)!==0,(d&32)!==0,(d&64)!==0,(d&128)!==0,
        !!(d&0xAA),!(d&0x55),!!(d&0xF0),!!(d&0x0F)];
    }
    case "raspberry-pi": {
      const clk = i("clk"), rst = i("rst");
      if (rst) return Array(10).fill(false);
      if (!clk) return Array(10).fill(false);
      const d = (i("gpio0")?1:0)|(i("gpio1")?2:0)|(i("gpio2")?4:0)|(i("gpio3")?8:0)|(i("gpio4")?16:0)|(i("gpio5")?32:0);
      return [(d&1)!==0,(d&2)!==0,(d&4)!==0,(d&8)!==0,(d&16)!==0,(d&32)!==0,!!(d&3),!!(d&12),!!(d&0xAA),!!(d&0x55)];
    }
    case "raspberry-pi-pico": {
      const clk = i("clk"), rst = i("rst");
      if (rst) return Array(10).fill(false);
      if (!clk) return Array(10).fill(false);
      const d = (i("gp0")?1:0)|(i("gp1")?2:0)|(i("gp2")?4:0)|(i("gp3")?8:0)|(i("gp4")?16:0)|(i("gp5")?32:0);
      return [(d&1)!==0,(d&2)!==0,(d&4)!==0,(d&8)!==0,(d&16)!==0,(d&32)!==0,!!(d&3),!!(d&12),!!(d&0xF0),!!(d&0x0F)];
    }
    case "esp32": {
      const clk = i("clk"), rst = i("rst");
      if (rst) return Array(11).fill(false);
      if (!clk) return Array(11).fill(false);
      const d = (i("gpio0")?1:0)|(i("gpio1")?2:0)|(i("gpio2")?4:0)|(i("gpio3")?8:0)|(i("gpio4")?16:0)|(i("gpio5")?32:0)|(i("gpio6")?64:0)|(i("gpio7")?128:0);
      return [(d&1)!==0,(d&2)!==0,(d&4)!==0,(d&8)!==0,(d&16)!==0,(d&32)!==0,
        !!(d&0xAA),!!(d&0x55),!!(d&0xF0),!!(d&0x0F),!!(d)];
    }
    case "stm32": {
      const clk = i("clk"), rst = i("rst");
      if (rst) return Array(11).fill(false);
      if (!clk) return Array(11).fill(false);
      const d = (i("pa0")?1:0)|(i("pa1")?2:0)|(i("pa2")?4:0)|(i("pa3")?8:0)|(i("pb0")?16:0)|(i("pb1")?32:0);
      return [(d&1)!==0,(d&2)!==0,(d&4)!==0,(d&8)!==0,(d&16)!==0,(d&32)!==0,
        !!(d&0xAA),!!(d&0x55),!!(d&0xF),!!(d&0xF0),!!(d&0xC)];
    }

    // ====== GPU ======
    case "gpu-block": {
      if (!i("clk") || !i("en") || i("rst")) return Array(9).fill(false);
      const d = (i("d0")?1:0)|(i("d1")?2:0)|(i("d2")?4:0)|(i("d3")?8:0)|(i("d4")?16:0)|(i("d5")?32:0)|(i("d6")?64:0)|(i("d7")?128:0);
      // SIMD: 4 parallel multiply-accumulate operations
      const p0 = ((d>>0)&3) * ((d>>2)&3); // lane 0
      const p1 = ((d>>4)&3) * ((d>>6)&3); // lane 1
      const sum = (p0 + p1) & 0xff;
      return Array.from({length:8},(_,j)=>!!(sum&(1<<j))).concat([true]); // + done
    }

    // ====== Advanced Actuators ======
    case "esc": // ESC: PWM signal+enable → motor drive
      return [i("signal") && i("en")];
    case "motor-driver": { // L298N dual H-bridge: 2 channels
      return [i("in1") && i("enA"), i("in2") && i("enA"), i("in3") && i("enB"), i("in4") && i("enB")];
    }
    case "robotic-arm-6dof": { // 6-DOF arm: joint interpolation on clk
      const clk = i("clk"), en = i("en");
      if (!clk || !en) return [false, false, false];
      const joints = (i("j0")?1:0)|(i("j1")?2:0)|(i("j2")?4:0)|(i("j3")?8:0)|(i("j4")?16:0)|(i("j5")?32:0);
      return [true, !!(joints & 0x0F), !!(joints & 0x30)]; // moving, lower-3, upper-3
    }
    case "pneumatic-cylinder":
      return [i("in") && i("en")];

    // ====== Robotics — kinematics ======
    case "wheel-mecanum": { // Mecanum: inverse kinematics X/Y/Yaw → 4 wheels
      const x = i("fl") ? 1 : 0, y = i("fr") ? 1 : 0, yaw = i("rl") ? 1 : 0;
      // Simplified mecanum IK
      const fl = (x + y + yaw) > 0;
      const fr = (x - y + yaw) > 0;
      const rl = (x - y - yaw) > 0;
      const rr = (x + y - yaw) > 0;
      return [fl, fr, rl, rr]; // 4 wheel outputs
    }
    case "wheel-omni": { // Omni: X/Y/rotation → 3 wheels at 120°
      const x = i("x"), y = i("y"), rot = i("rot");
      // Simplified 3-wheel omni IK
      const w1 = x || rot;
      const w2 = (!x && y) || rot;
      const w3 = x || (!y && rot);
      return [w1, w2, w3]; // 3 wheel outputs
    }
    case "chassis-frame": { // Encoder counter from wheel inputs
      if (!(node as any).state) (node as any).state = [0,0,0,0];
      const encs = (node as any).state as number[];
      const wheels = [i("fl"), i("fr"), i("rl"), i("rr")];
      return wheels.map((w,j) => {
        if (w) encs[j] = (encs[j] + 1) % 16;
        return !!(encs[j] & 1); // encoder pulse
      });
    }
    case "industrial-6axis": { // 6-axis robot: forward kinematics
      const clk = i("clk"), en = i("en"), rst = i("rst");
      if (rst) { (node as any).state = 0; return Array(7).fill(false); }
      if (!clk || !en) return Array(7).fill(false);
      const joints = (i("j0")?1:0)|(i("j1")?2:0)|(i("j2")?4:0)|(i("j3")?8:0)|(i("j4")?16:0)|(i("j5")?32:0);
      // Simplified FK: compute approximate XYZ from joint bits
      const j0a = (joints & 1) ? 45 : 0; // base rotation
      const j1a = (joints & 2) ? 30 : 0; // shoulder
      const j2a = (joints & 4) ? 60 : 0; // elbow
      // Approximate Cartesian positions
      const x = Math.round(Math.cos(j0a * Math.PI/180) * 10);
      const y = Math.round(Math.sin(j0a * Math.PI/180) * 10);
      const z = Math.round(5 + Math.sin(j1a * Math.PI/180) * 8 - Math.sin(j2a * Math.PI/180) * 4);
      const rx = j0a > 0 ? 1 : 0, ry = j1a > 0 ? 1 : 0, rz = j2a > 0 ? 1 : 0;
      return [!!(x&1), !!(y&1), !!(z&1), !!rx, !!ry, !!rz, true]; // x,y,z,rx,ry,rz,done
    }
    case "scara-arm": { // SCARA: 2-link planar arm
      const clk = i("clk"), en = i("en");
      if (!clk || !en) return [false, false, false];
      const j0 = i("j0") ? 60 : 0; // joint 1 angle
      const j1 = i("j1") ? 45 : 0; // joint 2 angle
      const l1 = 10, l2 = 8; // link lengths
      const x = Math.round(l1 * Math.cos(j0*Math.PI/180) + l2 * Math.cos((j0+j1)*Math.PI/180));
      const y = Math.round(l1 * Math.sin(j0*Math.PI/180) + l2 * Math.sin((j0+j1)*Math.PI/180));
      return [!!(x & 1), !!(y & 1), i("z")]; // x, y, z (vertical)
    }
    case "delta-robot": { // Delta: parallel manipulator workspace
      const clk = i("clk"), en = i("en");
      if (!clk || !en) return [false, false, false, false];
      const j = (i("j0")?1:0)|(i("j1")?2:0)|(i("j2")?4:0);
      // Approximate workspace position
      const x = ((j & 1) ? 3 : 0) - ((j & 2) ? 2 : 0);
      const y = ((j & 2) ? 3 : 0) - ((j & 4) ? 2 : 0);
      const z = 5 - ((j & 1) ? 2 : 0) - ((j & 2) ? 1 : 0) - ((j & 4) ? 1 : 0);
      return [!!(x & 1), !!(y & 1), !!(z & 1), true]; // x, y, z, done
    }
    case "gripper": { // 2-finger parallel gripper
      if (!i("en")) return [false, false];
      const pos = i("open") ? 100 : i("close") ? 0 : ((node as any).state || 50);
      (node as any).state = pos;
      return [pos > 50, pos < 10]; // pos (open), gripping
    }
    case "gripper-3f": { // 3-finger adaptive gripper
      if (!i("en")) return [false, false, false];
      const force = i("force") ? 80 : 40;
      const pos = Math.min(force, ((node as any).state || 0) + (i("f0")||i("f1")||i("f2") ? 10 : -5));
      (node as any).state = pos;
      return [pos > 50, pos > 80, pos >= force]; // pos, gripping, done
    }
    case "encoder": { // Quadrature rotary encoder
      if (i("rst")) { (node as any).state = 0; return [false, false, false]; }
      const cnt = ((node as any).state || 0) as number;
      const dir = i("ch_a") !== i("ch_b");
      const newCnt = dir ? cnt + 1 : cnt - 1;
      (node as any).state = newCnt;
      return [!!(newCnt & 1), dir, !!(cnt & 3)]; // count pulse, direction, speed
    }
    case "lidar": { // LIDAR distance scanner
      if (!i("en")) return [false, false, false, false];
      const scan = i("scan");
      const dist = scan ? (((node as any).state || 0) + 1) % 8 : ((node as any).state || 0);
      (node as any).state = dist;
      return [!!(dist & 1), !!(dist & 2), scan, scan]; // dist, angle, valid, done
    }
    case "imu": { // 6-axis IMU (accel + gyro)
      if (!i("en") || !i("clk")) return [false, false, false, false, false, false, false];
      const t = getTick();
      return [
        !!(Math.sin(t * 0.1) > 0), !!(Math.cos(t * 0.15) > 0), !!(Math.sin(t * 0.2) > 0), // ax, ay, az
        !!(Math.cos(t * 0.3) > 0), !!(Math.sin(t * 0.25) > 0), !!(Math.cos(t * 0.35) > 0), // gx, gy, gz
        true // valid
      ];
    }
    case "gps-rtk": { // RTK GPS with centimeter accuracy
      if (!i("en") || !i("clk")) return [false, false, false, false, false, false];
      const t = getTick();
      return [
        !!(t & 1), !!(t & 2), !!(t & 4), !!(t & 8), // lat, lon (split)
        true, true // fix, valid
      ];
    }
    case "bluetooth-rc": { // Bluetooth remote control
      if (!i("en")) return [false, false, false, false, false, false, false];
      const t = getTick();
      return [
        !!(t & 1), !!(t & 2), !!(t & 4), !!(t & 8), // fwd, rev, left, right
        !!(t & 16), !!(t & 32), true // btn0, btn1, connected
      ];
    }
    case "wifi-rc": { // WiFi remote control
      if (!i("en") || !i("clk")) return [false, false, false, false, false, false, false];
      const t = getTick();
      return [
        !!(t & 1), !!(t & 2), !!(t & 4), !!(t & 8), // fwd, rev, left, right
        !!(t & 16), !!(t & 32), true // speed0, speed1, connected
      ];
    }
    case "pid-controller": { // PID control loop
      if (!i("en")) return [false, false, false];
      const sp = i("setpoint") ? 100 : 0;
      const fb = i("feedback") ? 60 : 0;
      const err = sp - fb;
      const kp = (i("kp0") ? 2 : 0) + (i("kp1") ? 1 : 0);
      const out = Math.max(0, Math.min(255, err * kp));
      return [!!(out & 1), !!(err > 0), out > 0]; // output, error, done
    }
    case "kinematic-solver": { // Inverse kinematics solver
      const clk = i("clk"), en = i("en"), rst = i("rst");
      if (rst) { (node as any).state = 0; return Array(7).fill(false); }
      if (!clk || !en) return Array(7).fill(false);
      const tx = (i("tx")?1:0)|(i("ty")?2:0)|(i("tz")?4:0);
      const j0 = !!(tx & 1), j1 = !!(tx & 2), j2 = !!(tx & 4);
      return [j0, j1, j2, !j0, !j1, !j2, true]; // j0-j5, done
    }
    case "path-planner": { // A* path planner
      const clk = i("clk"), en = i("en");
      if (!clk || !en) return [false, false, false, false];
      const step = ((node as any).state || 0) as number;
      (node as any).state = (step + 1) % 8;
      return [!!(step & 1), !!(step & 2), !!(step & 4), step >= 7]; // px, py, step, done
    }
    case "collision-detector": { // Proximity-based collision avoidance
      if (!i("en")) return [false, false, false];
      const x0 = i("x0"), x1 = i("x1"), y0 = i("y0"), y1 = i("y1");
      const collision = (x0 === x1) && (y0 === y1);
      return [collision, collision, !collision]; // collision, dist, dir
    }
    case "gimbal": { // 2-axis camera gimbal stabilizer
      if (!i("en")) return [false, false, false];
      const stabilize = i("stabilize");
      return [i("pan") || stabilize, i("tilt") || stabilize, stabilize]; // pan_out, tilt_out, locked
    }
    case "rover-diff": { // Differential drive rover
      if (!i("en")) return [false, false, false, false];
      const lm = i("lmotor"), rm = i("rmotor");
      const speed = lm || rm;
      const turn = lm !== rm;
      return [speed, turn, lm, rm]; // speed, turn, enc_l, enc_r
    }
    case "tracked-base": { // Tracked/caterpillar drive
      if (!i("en")) return [false, false, false, false];
      const lm = i("lmotor"), rm = i("rmotor");
      const speed = lm || rm;
      const turn = lm !== rm;
      return [speed, turn, lm, rm]; // speed, turn, enc_l, enc_r
    }
    case "drone-quad": { // Quadcopter mixing
      if (!i("en")) return [false, false, false, false, false];
      const thr = i("throttle"), roll = i("roll"), pitch = i("pitch"), yaw = i("yaw");
      const m1 = thr && !(roll && pitch);
      const m2 = thr && !(!roll && pitch);
      const m3 = thr && !(roll && !pitch);
      const m4 = thr && !(!roll && !pitch);
      return [m1, m2, m3, m4, thr]; // m1-m4, armed
    }
    case "flight-ctrl": { // Flight controller with PID mixing
      if (!i("en")) return [false, false, false, false, false, false];
      const en = true;
      const armed = i("rc3"); // throttle arm
      const m1 = armed && (i("ax") || i("rc0"));
      const m2 = armed && (i("ay") || i("rc1"));
      const m3 = armed && (i("az") || i("rc2"));
      const m4 = armed && (i("gx") || i("gy"));
      return [m1, m2, m3, m4, armed, armed]; // m1-m4, mode, armed
    }
    case "propeller-motor": { // Brushless motor + propeller
      const throttle = i("throttle");
      const rpm = throttle ? 12000 : 0;
      return [!!(rpm & 1), throttle]; // rpm, current
    }
    case "linear-guide": { // Linear rail positioner
      if (!i("en")) return [false, false, false];
      const pos = i("pos") ? 100 : 0;
      const home = !pos;
      return [!!(pos & 1), home, !home]; // position, home, limit
    }
    case "stepper-nema": { // NEMA stepper motor
      if (i("en")) return [false, false];
      const cnt = ((node as any).state || 0) as number;
      if (i("step")) (node as any).state = cnt + (i("dir") ? 1 : -1);
      return [!!((node as any).state & 1), i("step")]; // position, moving
    }
    case "harmonic-drive": { // Harmonic drive reducer (1:100 ratio)
      if (!i("en")) return [false, false];
      const inp = i("input");
      return [inp, inp]; // output (reduced), torque (amplified)
    }
    case "lead-screw": { // Lead screw linear actuator
      if (!i("en")) return [false, false];
      const motor = i("motor");
      return [motor, motor]; // position, force
    }

    // ====== Industrial ======
    case "plc-controller": { // PLC: ladder logic scan cycle
      const clk = i("clk"), rst = i("rst");
      if (rst) return Array(9).fill(false);
      if (!clk) return Array(9).fill(false);
      // Ladder scan: inputs → process → outputs
      return [i("i0"),i("i1"),i("i2"),i("i3"),i("i4"),i("i5"),i("i6"),i("i7"),true];
    }
    case "plc-io-module": {
      if (!i("en")) return Array(4).fill(false);
      return [i("i0"),i("i1"),i("i2"),i("i3")];
    }
    case "vfd-drive": { // VFD: variable frequency drive
      if (!i("en")) return Array(4).fill(false);
      return [i("speed"),i("dir"),!i("dir"),false]; // u, v, w phases + fault
    }
    case "servo-drive": { // Servo: position command + feedback
      if (!i("en")) return Array(3).fill(false);
      return [i("pos"),i("vel"),i("pos")===i("vel")]; // cmd, feedback, done
    }
    case "proximity-switch": { // Inductive/Capacitive proximity
      const t = getTick();
      const det = ((t+seedH)%13 < 6);
      advanceTick();
      return [det, det, !det]; // no-npn, pnp, fault
    }

    default: return [];
  }
}

export function simulate(circuit: Circuit): Circuit {
  const nodes = circuit.nodes.map((n) => ({
    ...n,
    inputs: { ...n.inputs },
    outputs: { ...n.outputs },
  }));

  for (let iter = 0; iter < 30; iter++) {
    let changed = false;

    for (const node of nodes) {
      const outKeys = Object.keys(node.outputs);
      const vals = evalNode(node);
      outKeys.forEach((k, idx) => {
        const v = vals[idx] ?? false;
        if (node.outputs[k] !== v) { node.outputs[k] = v; changed = true; }
      });
    }

    for (const wire of circuit.wires) {
      const src = nodes.find((n) => n.id === wire.fromNode);
      const dst = nodes.find((n) => n.id === wire.toNode);
      if (src && dst) {
        const v = !!src.outputs[wire.fromPort];
        if (dst.inputs[wire.toPort] !== v) { dst.inputs[wire.toPort] = v; changed = true; }
      }
    }

    if (!changed) break;
  }

  return { nodes, wires: [...circuit.wires] };
}

export function generateTruthTable(circuit: Circuit) {
  const inputs = circuit.nodes.filter((n) => ["toggle","const-0","const-1","button","dip-switch","keypad","analog-in","push-button","voltage-src-4","data-bus-in","addr-input","step-input","status-in","control-in","strobe-in","ready-in","ack-in","busy-in","interrupt-in","dma-in","hold-in","bus-req-in","test-mode","enable-all","global-reset","random","pulse-gen","edge-det","edge-det-f"].includes(n.type));
  const outputs = circuit.nodes.filter((n) => ["bulb","hex-display","led","d-latch","d-flipflop","t-flipflop","sr-latch","jk-flipflop","7-segment","buzzer","bar-graph","tri-led","stepper-motor","servo-motor","traffic-light","digit-display","dot-matrix","scope-output","indicator-panel","seven-seg-4","ascii-display","signal-analyzer","voltmeter","ammeter","clock-display","thermometer-out","tachometer","power-meter","data-latch-disp","status-led","lcd-display"].includes(n.type));

  if (inputs.length === 0 || outputs.length === 0) return { headers: [], rows: [] };

  const n = inputs.length;
  if (n > 12) return { headers: [], rows: [] };
  const rows: { inputs: Record<string, boolean>; outputs: Record<string, boolean> }[] = [];

  for (let i = 0; i < Math.pow(2, n); i++) {
    const testCircuit: Circuit = {
      nodes: circuit.nodes.map((node) => {
        const idx = inputs.indexOf(node);
        if (idx >= 0) {
          return { ...node, inputs: { ...node.inputs }, outputs: { out: !!((i >> (n - 1 - idx)) & 1) } };
        }
        return { ...node, inputs: { ...node.inputs }, outputs: { ...node.outputs } };
      }),
      wires: [...circuit.wires],
    };

    const result = simulate(testCircuit);
    const iv: Record<string, boolean> = {};
    const ov: Record<string, boolean> = {};

    for (const inp of inputs) {
      const r = result.nodes.find((nd) => nd.id === inp.id);
      iv[inp.id] = r ? !!Object.values(r.outputs)[0] : false;
    }
    for (const out of outputs) {
      const r = result.nodes.find((nd) => nd.id === out.id);
      ov[out.id] = r ? !!Object.values(r.inputs)[0] : false;
    }

    rows.push({ inputs: iv, outputs: ov });
  }

  const liveSim = simulate(circuit);
  const currentInputs: Record<string, boolean> = {};
  for (const inp of inputs) {
    const r = liveSim.nodes.find((nd) => nd.id === inp.id);
    currentInputs[inp.id] = r ? !!Object.values(r.outputs)[0] : false;
  }
  const currentOutputs: Record<string, boolean> = {};
  for (const out of outputs) {
    const r = liveSim.nodes.find((nd) => nd.id === out.id);
    currentOutputs[out.id] = r ? !!Object.values(r.inputs)[0] : false;
  }

  const activeRowIndex = rows.findIndex((row) =>
    inputs.every((inp) => row.inputs[inp.id] === currentInputs[inp.id])
  );

  return {
    headers: [...inputs.map((n) => n.id), "", ...outputs.map((n) => n.id)],
    rows,
    inputNodes: inputs,
    outputNodes: outputs,
    currentInputs,
    currentOutputs,
    activeRowIndex,
  };
}