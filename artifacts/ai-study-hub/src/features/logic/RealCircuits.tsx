import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { realSensors, SENSOR_CHANNELS } from "./realSensors";
import { cn } from "@/lib/utils";

type Phase = "normal" | "prealarm" | "alarm";
type LogKind = "info" | "warn" | "fire" | "ok" | "net";

interface LogEntry { t: number; kind: LogKind; msg: string; }

interface Notif { t: number; kind: string; to: string; msg: string; }

interface SensorDef {
  id: string;
  addr: number;
  name: string;
  type: string;
  zone: string;
}

const SENSORS: SensorDef[] = [
  { id: "heat", addr: 1, name: "HEAT DETECTOR", type: "Fixed 57°C + RoR 8.3°/min", zone: "ZONE 1 · G/F LOBBY" },
  { id: "smoke", addr: 2, name: "SMOKE DETECTOR", type: "Photoelectric 0.5 dB/m", zone: "ZONE 1 · G/F LOBBY" },
  { id: "flame", addr: 3, name: "FLAME DETECTOR", type: "IR3 / UV wideband", zone: "ZONE 2 · BOILER RM" },
  { id: "manual", addr: 4, name: "MANUAL CALL PT", type: "Break-glass pull station", zone: "ZONE 2 · BOILER RM" },
];

const TEMP_MIN = SENSOR_CHANNELS.temp.min;
const TEMP_MAX = SENSOR_CHANNELS.temp.max;
const TEMP_BITS = SENSOR_CHANNELS.temp.bits;

function mapToBits(value: number, min: number, max: number, bits: number) {
  const norm = max > min ? (value - min) / (max - min) : 0;
  const int = Math.round(norm * ((1 << bits) - 1));
  return Math.max(0, Math.min((1 << bits) - 1, int));
}

function nowHMS() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function Wire({ d, active, color = "#ef4444" }: { d: string; active: boolean; color?: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={2} />
      {active && (
        <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"
          className="rc-wire" style={{ strokeDasharray: "6 6" }} />
      )}
    </g>
  );
}

function Block({ x, y, w, h, title, sub, val, status, accent }: {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string; val?: string;
  status: "idle" | "ok" | "warn" | "fire";
  accent?: string;
}) {
  const colors: Record<typeof status, string> = {
    idle: "rgba(0,0,0,0.35)",
    ok: "#16a34a",
    warn: "#f59e0b",
    fire: "#ef4444",
  };
  const fill: Record<typeof status, string> = {
    idle: "rgba(255,255,255,0.9)",
    ok: "rgba(22,163,74,0.08)",
    warn: "rgba(245,158,11,0.1)",
    fire: "rgba(239,68,68,0.12)",
  };
  const c = accent ?? colors[status];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill={fill[status]} stroke={status === "idle" ? "rgba(0,0,0,0.16)" : c}
        strokeWidth={status === "idle" ? 1.4 : 2} />
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="system-ui" fill="#2D2D2D">{title}</text>
      {sub && <text x={x + w / 2} y={y + 32} textAnchor="middle" fontSize={9.5} fontWeight={500} fill="#6B6B6B">{sub}</text>}
      {val && (
        <g>
          <rect x={x + 8} y={y + h - 20} width={w - 16} height={14} rx={5}
            fill={status === "idle" ? "rgba(0,0,0,0.05)" : `${c}18`} />
          <text x={x + w / 2} y={y + h - 10} textAnchor="middle" fontSize={9.5} fontWeight={800} fontFamily="ui-monospace,monospace" fill={c}>{val}</text>
        </g>
      )}
    </g>
  );
}

function pathD(x1: number, y1: number, x2: number, y2: number) {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`;
}

export default function RealCircuits({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("normal");
  const [tempC, setTempC] = useState(24.0);
  const [smokePct, setSmokePct] = useState(0.4);
  const [flameOn, setFlameOn] = useState(false);
  const [manualOn, setManualOn] = useState(false);
  const [silenced, setSilenced] = useState(false);
  const [verifyLeft, setVerifyLeft] = useState(0);
  const [latched, setLatched] = useState(false);
  const [fault, setFault] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [notified, setNotified] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connType, setConnType] = useState("none");
  const [simSpeed, setSimSpeed] = useState(1);
  const [fireActive, setFireActive] = useState(false);
  const [tempThresh, setTempThresh] = useState(57);
  const [rateThresh, setRateThresh] = useState(8.3);
  const [smokeThresh, setSmokeThresh] = useState(0.5);
  const [verifySecs, setVerifySecs] = useState(5);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [now, setNow] = useState(nowHMS());
  const [storeTick, setStoreTick] = useState(0);

  const history = useRef<number[]>([]);
  const lastSample = useRef(0);
  const lastVerify = useRef(0);
  const fireTarget = useRef(0);

  const addLog = useCallback((kind: LogKind, msg: string) => {
    setLog((l) => [{ t: Date.now(), kind, msg }, ...l].slice(0, 60));
  }, []);

  const addNotif = useCallback((kind: string, to: string, msg: string) => {
    setNotifs((n) => [{ t: Date.now(), kind, to, msg }, ...n].slice(0, 30));
  }, []);

  useEffect(() => {
    const unsub = realSensors.subscribe(() => setStoreTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    setConnected(realSensors.connected);
    setConnType(realSensors.connectionType);
    if (realSensors.connected) {
      addLog("ok", `Real sensor link established via ${realSensors.connectionType === "serial" ? "USB Serial" : "WebSocket"}. Data mapping active.`);
    }
  }, [storeTick]);

  useEffect(() => {
    setNow(nowHMS());
    const i = setInterval(() => setNow(nowHMS()), 1000);
    return () => clearInterval(i);
  }, []);

  const doReset = useCallback(() => {
    setLatched(false);
    setSilenced(false);
    setVerifyLeft(0);
    setNotified(false);
    setPhase("normal");
    setManualOn(false);
    addLog("ok", "System reset by operator. Devices returned to standby.");
    setNotifs((n) => [{ t: Date.now(), kind: "panel", to: "FACP", msg: "SYSTEM RESET" }, ...n].slice(0, 30));
  }, [addLog]);

  const doSilence = useCallback(() => {
    setSilenced(true);
    addLog("info", "Siren silenced (strobes and LEDs remain active).");
  }, [addLog]);

  const doTest = useCallback(() => {
    setTestMode(true);
    addLog("info", "Walk-test initiated — all NAC outputs pulsed for 2s.");
    addNotif("test", "FACP", "DEVICE TEST OK · D1–D4 responded");
    setTimeout(() => setTestMode(false), 2000);
  }, [addLog, addNotif]);

  const toggleFire = useCallback(() => {
    if (fireActive) {
      setFireActive(false);
      fireTarget.current = 24;
      addLog("info", "Fire scenario cleared. Temperature returning to ambient.");
    } else {
      setFireActive(true);
      fireTarget.current = 88;
      setSmokePct(6.5);
      addLog("fire", "FIRE SCENARIO ENGAGED — heat + smoke rise detected.");
    }
  }, [fireActive, addLog]);

  useEffect(() => {
    const iv = setInterval(() => {
      setNow(nowHMS());

      const storeTemp = realSensors.getChannelValue("temp");
      let t = storeTemp ?? tempC;

      if (realSensors.connected) {
        t = storeTemp ?? tempC;
      } else {
        if (fireActive) {
          const k = 0.12 * simSpeed;
          t = t + (fireTarget.current - t) * k + (Math.random() - 0.5) * 0.3;
        } else {
          const wave = Math.sin(Date.now() / 4000) * 0.8 + (Math.random() - 0.5) * 0.4 * simSpeed;
          t = 23 + wave + 1.2 * Math.sin(Date.now() / 17000);
          t = Math.max(18, Math.min(30, t));
        }
      }

      realSensors.setChannelValue("temp", t);
      setTempC(t);

      const nowMs = Date.now();
      if (lastSample.current === 0 || nowMs - lastSample.current > 180) {
        history.current.push(t);
        if (history.current.length > 12) history.current.shift();
        lastSample.current = nowMs;
      }
      const h = history.current;
      const rate = h.length >= 2 ? ((h[h.length - 1] - h[0]) / Math.max(1, (h.length - 1) * 0.2)) * 60 : 0;

      if (!realSensors.connected && !fireActive && smokePct > 0.6) {
        setSmokePct((s) => Math.max(0.4, s - 0.05 * simSpeed));
      }

      const heatFixed = t >= tempThresh;
      const heatRate = rate >= rateThresh;
      const smokeDetect = smokePct >= smokeThresh;
      const anyDetect = heatFixed || heatRate || smokeDetect || flameOn || manualOn;

      if (!latched && anyDetect && verifyLeft === 0) {
        setPhase("prealarm");
        setVerifyLeft(Math.max(1, Math.round(verifySecs)));
        lastVerify.current = nowMs;
        addLog("warn", `PRE-ALARM · zone event detected (T=${t.toFixed(1)}°C, RoR=${rate.toFixed(1)}°/min, smoke=${smokePct.toFixed(1)}%). Verifying…`);
      } else if (verifyLeft > 0) {
        if (!anyDetect) {
          setVerifyLeft(0);
          setPhase("normal");
          addLog("info", "Detection cleared during verification — alarm not confirmed.");
        } else if (verifyLeft <= 1) {
          setVerifyLeft(0);
          setLatched(true);
          setPhase("alarm");
          const detName =
            heatFixed || heatRate ? "HEAT DETECTOR" :
            smokeDetect ? "SMOKE DETECTOR" :
            flameOn ? "FLAME DETECTOR" : "MANUAL CALL POINT";
          addLog("fire", `FIRE CONFIRMED · ${detName} — latching alarm.`);
        } else if (nowMs - lastVerify.current >= 1000) {
          setVerifyLeft(verifyLeft - 1);
          lastVerify.current = nowMs;
        }
      } else if (!latched) {
        setPhase("normal");
      }

      if (latched && !notified) {
        setNotified(true);
        addNotif("push", "Owner · +112 APP", `FIRE ALARM — Zone 1 · T=${t.toFixed(1)}°C · EVACUATE`);
        addNotif("sms", "Monitoring stn", "AUTO-DIAL 112 · LATCHED ALARM @ G/F LOBBY");
        addNotif("email", "BMS / cloud", "NAC active · fan stop · lift recall · door release");
        addLog("net", "Smart system notified: push + SMS + BMS relay (simulated).");
      }
    }, 200);
    return () => clearInterval(iv);
  }, [fireActive, simSpeed, tempC, smokePct, tempThresh, rateThresh, smokeThresh, verifyLeft, verifySecs, latched, notified, addLog, addNotif]);

  const heatFixed = tempC >= tempThresh;
  const rateVal = useMemo(() => {
    const h = history.current;
    return h.length >= 2 ? ((h[h.length - 1] - h[0]) / Math.max(1, (h.length - 1) * 0.2)) * 60 : 0;
  }, [tempC]);
  const smokeDetect = smokePct >= smokeThresh;
  const anyDetect = heatFixed || rateVal >= rateThresh || smokeDetect || flameOn || manualOn;
  const adcHeat = mapToBits(tempC, TEMP_MIN, TEMP_MAX, TEMP_BITS);

  const sirenOn = (latched || testMode) && !silenced;
  const strobeOn = latched || testMode;

  const tmpLog = log.map((e) => ({ ...e }));
  const tmpNotif = notifs.map((e) => ({ ...e }));

  const sensorStatus = (id: string) => {
    if (fault) return "warn" as const;
    if (id === "heat") return heatFixed || rateVal >= rateThresh ? ("fire" as const) : ("ok" as const);
    if (id === "smoke") return smokeDetect ? ("fire" as const) : ("ok" as const);
    if (id === "flame") return flameOn ? ("fire" as const) : ("ok" as const);
    if (id === "manual") return manualOn ? ("fire" as const) : ("ok" as const);
    return "ok" as const;
  };

  const handleSerial = async () => {
    try {
      addLog("info", "Requesting USB Serial port… (Chrome/Edge). Expected JSON lines like {\"temp\":25.3}.");
      await realSensors.connectSerial();
    } catch (e) {
      addLog("warn", `Serial connect failed: ${e instanceof Error ? e.message : "unsupported browser"}`);
    }
  };

  const handleWS = () => {
    const url = prompt("WebSocket URL:", "ws://localhost:8765");
    if (url) {
      realSensors.connectWebSocket(url);
      addLog("info", `Connecting WebSocket ${url}…`);
    }
  };

  const handleDisconnect = () => {
    realSensors.disconnect();
    addLog("info", "Real sensor link disconnected — returning to simulation mode.");
  };

  const led = (on: boolean, color: string, label: string) => (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2.5 h-2.5 rounded-full", on && "rc-led")} style={{ background: on ? color : "rgba(0,0,0,0.12)" }} />
      <span className="text-[9px] font-bold tracking-wider" style={{ color: on ? color : "#9A9A9A" }}>{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <style>{`
        .rc-wire { animation: rcFlow 0.5s linear infinite; }
        @keyframes rcFlow { to { stroke-dashoffset: -12; } }
        .rc-led { animation: rcLed 0.8s ease-in-out infinite; }
        @keyframes rcLed { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        .rc-pulse { animation: rcPulse 1s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } }
        .rc-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .rc-scroll::-webkit-scrollbar { width: 6px; }
        .rc-scroll::-webkit-scrollbar-track { background: transparent; }
        .rc-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.14); border-radius: 6px; }
      `}</style>

      <div className="w-full max-w-[1240px] max-h-[96vh] overflow-y-auto rc-scroll rounded-3xl border shadow-2xl"
        style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* ===== Header ===== */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-4 border-b" style={{ background: "rgba(255,248,240,0.94)", borderColor: "rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", boxShadow: "0 4px 14px rgba(255,159,76,0.35)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold" style={{ color: "#2D2D2D" }}>Real Circuits</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,159,76,0.12)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.2)" }}>
                Modern Fire Alarm System
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "#6B6B6B" }}>
              Full EN54 workflow: real sensor → mapping → detection → latching panel → NAC + smart notification. {now}
            </p>
          </div>
          <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold", phase === "alarm" && "rc-pulse")}
            style={{ background: phase === "alarm" ? "rgba(239,68,68,0.12)" : phase === "prealarm" ? "rgba(245,158,11,0.12)" : "rgba(22,163,74,0.1)", color: phase === "alarm" ? "#ef4444" : phase === "prealarm" ? "#f59e0b" : "#16a34a", border: "1px solid" + (phase === "alarm" ? "rgba(239,68,68,0.3)" : phase === "prealarm" ? "rgba(245,158,11,0.3)" : "rgba(22,163,74,0.3)") }}>
            <span className="w-2 h-2 rounded-full" style={{ background: phase === "alarm" ? "#ef4444" : phase === "prealarm" ? "#f59e0b" : "#16a34a" }} />
            {phase === "alarm" ? "ALARM" : phase === "prealarm" ? "PRE-ALARM" : "SYSTEM NORMAL"}
          </span>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4 p-4 sm:p-6">
          {/* ===== Left: live circuit ===== */}
          <div className="min-w-0">
            <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: "#FF9F4C" }} />
                  <span className="text-[11px] font-bold" style={{ color: "#2D2D2D" }}>Live Signal Chain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: connected ? "#16a34a" : "#FF9F4C" }} />
                  <span className="text-[9px] font-semibold" style={{ color: "#6B6B6B" }}>
                    {connected ? `LIVE · ${connType === "serial" ? "USB Serial" : "WebSocket"}` : "Simulation mode"}
                  </span>
                </div>
              </div>
              <svg viewBox="0 0 1160 600" className="w-full h-auto" role="img" aria-label="Fire alarm system circuit">
                {/* power bus */}
                <line x1="105" y1="470" x2="105" y2="40" stroke="rgba(0,0,0,0.08)" strokeWidth="2" strokeDasharray="4 4" />
                <text x="112" y="250" fontSize="9" fill="#9A9A9A" fontFamily="system-ui" transform="rotate(90 112 250)">24V SUPERVISED LOOP · CLASS B · A–D</text>

                {/* Stage labels */}
                <text x="105" y="20" fontSize="10" fontWeight={800} fill="#9A9A9A" fontFamily="system-ui" letterSpacing={1}>INPUTS · FIELD DEVICES</text>
                <text x="340" y="20" fontSize="10" fontWeight={800} fill="#9A9A9A" fontFamily="system-ui" letterSpacing={1}>CONDITIONING / ADC</text>
                <text x="575" y="20" fontSize="10" fontWeight={800} fill="#9A9A9A" fontFamily="system-ui" letterSpacing={1}>DETECTION LOGIC</text>
                <text x="805" y="20" fontSize="10" fontWeight={800} fill="#9A9A9A" fontFamily="system-ui" letterSpacing={1}>DECISION / LATCH</text>
                <text x="1020" y="20" fontSize="10" fontWeight={800} fill="#9A9A9A" fontFamily="system-ui" letterSpacing={1}>OUTPUTS / NAC + SMART</text>

                {/* WIRES */}
                <Wire d={pathD(190, 62, 250, 62)} active={true} color="#FF9F4C" />
                <Wire d={pathD(430, 62, 490, 48)} active={heatFixed || rateVal >= rateThresh} />
                <Wire d={pathD(430, 62, 490, 118)} active={rateVal >= rateThresh} color="#f59e0b" />
                <Wire d={pathD(670, 48, 730, 190)} active={heatFixed} />
                <Wire d={pathD(670, 118, 730, 170)} active={rateVal >= rateThresh} color="#f59e0b" />
                <Wire d={pathD(190, 152, 250, 152)} active={true} color="#FF9F4C" />
                <Wire d={pathD(430, 152, 490, 208)} active={smokeDetect} />
                <Wire d={pathD(670, 208, 730, 210)} active={smokeDetect} />
                <Wire d={pathD(190, 242, 250, 242)} active={true} color="#FF9F4C" />
                <Wire d={pathD(430, 242, 490, 298)} active={flameOn} />
                <Wire d={pathD(670, 298, 730, 230)} active={flameOn} />
                <Wire d={pathD(190, 332, 490, 388)} active={manualOn} />
                <Wire d={pathD(670, 388, 730, 250)} active={manualOn} />
                <Wire d={pathD(910, 182, 730, 282)} active={anyDetect} color="#FF9F4C" />
                <Wire d={pathD(910, 292, 730, 402)} active={latched} />
                <Wire d={pathD(910, 402, 950, 60)} active={sirenOn} />
                <Wire d={pathD(910, 402, 950, 150)} active={strobeOn} />
                <Wire d={pathD(910, 402, 950, 240)} active={latched} />
                <Wire d={pathD(910, 402, 950, 330)} active={latched} />
                <Wire d={pathD(910, 402, 950, 425)} active={latched} />
                <Wire d={pathD(910, 402, 950, 545)} active={latched} />

                {/* INPUTS */}
                <Block x={20} y={30} w={170} h={64} title="HEAT DETECTOR" sub="D1 · A1R" val={`${tempC.toFixed(1)}°C`} status={heatFixed || rateVal >= rateThresh ? "fire" : "ok"} />
                <Block x={20} y={120} w={170} h={64} title="SMOKE DETECTOR" sub="D2 · Photo" val={`${smokePct.toFixed(1)} %/m`} status={smokeDetect ? "fire" : "ok"} />
                <Block x={20} y={210} w={170} h={64} title="FLAME DETECTOR" sub="D3 · IR3/UV" val={flameOn ? "FLAME" : "CLEAR"} status={flameOn ? "fire" : "ok"} />
                <Block x={20} y={300} w={170} h={64} title="MANUAL CALL PT" sub="D4 · Break glass" val={manualOn ? "ACTIVE" : "STANDBY"} status={manualOn ? "fire" : "ok"} />
                <Block x={20} y={470} w={170} h={80} title="POWER" sub="Mains + batt" val={fault ? "FAULT" : "24.1V OK"} status={fault ? "warn" : "ok"} accent={fault ? "#f59e0b" : "#16a34a"} />

                {/* CONDITIONING */}
                <Block x={250} y={30} w={180} h={64} title="TEMP → ADC" sub="8-bit mapping" val={`${adcHeat} / 255`} status="ok" accent="#FF9F4C" />
                <Block x={250} y={120} w={180} h={64} title="OBSCURATION" sub="Photo cell" val={`${Math.min(100, Math.round(smokePct * 20))}%`} status="ok" accent="#FF9F4C" />
                <Block x={250} y={210} w={180} h={64} title="IR/UV ANALOG" sub="Wideband" val={flameOn ? "HIGH" : "LOW"} status="ok" accent="#FF9F4C" />

                {/* DETECTION LOGIC */}
                <Block x={490} y={20} w={180} h={56} title="FIXED TEMP ≥" sub={`${tempThresh}°C`} val={heatFixed ? "TRIP" : "CLEAR"} status={heatFixed ? "fire" : "idle"} />
                <Block x={490} y={90} w={180} h={56} title="RATE OF RISE ≥" sub={`${rateThresh}°/min`} val={`${rateVal.toFixed(1)}`} status={rateVal >= rateThresh ? "fire" : "idle"} />
                <Block x={490} y={180} w={180} h={56} title="SMOKE ≥" sub={`${smokeThresh.toFixed(1)} %/m`} val={smokeDetect ? "TRIP" : "CLEAR"} status={smokeDetect ? "fire" : "idle"} />
                <Block x={490} y={270} w={180} h={56} title="FLAME / IR" sub="D3 input" val={flameOn ? "TRIP" : "CLEAR"} status={flameOn ? "fire" : "idle"} />
                <Block x={490} y={360} w={180} h={56} title="MANUAL INPUT" sub="D4 · latching" val={manualOn ? "TRIP" : "CLEAR"} status={manualOn ? "fire" : "idle"} />

                {/* DECISION */}
                <Block x={730} y={150} w={180} h={64} title="OR · ANY DEVICE" sub="Single device → verify" val={anyDetect ? "EVENT" : "STANDBY"} status={anyDetect ? "warn" : "idle"} />
                <Block x={730} y={250} w={180} h={64} title={`VERIFY · ${verifySecs}s`} sub={verifyLeft > 0 ? "Confirmation window" : "Debounce + reset"} val={verifyLeft > 0 ? `${verifyLeft}s` : phase === "prealarm" ? "VERIFYING" : "IDLE"} status={verifyLeft > 0 ? "warn" : "idle"} />
                <Block x={730} y={360} w={180} h={64} title="ALARM LATCH · SR" sub="Latching until reset" val={latched ? "SET" : "RESET"} status={latched ? "fire" : "idle"} />

                {/* OUTPUTS */}
                <Block x={950} y={30} w={190} h={60} title="SIREN · NAC 1" sub="85 dB pulsing" val={sirenOn ? "SOUNDING" : "QUIET"} status={sirenOn ? "fire" : "idle"} />
                <Block x={950} y={120} w={190} h={60} title="STROBE · NAC 2" sub="Red, 1 Hz" val={strobeOn ? "FLASHING" : "OFF"} status={strobeOn ? "fire" : "idle"} />
                <Block x={950} y={210} w={190} h={60} title="RELAYS" sub="Fan · Lift · Door" val={latched ? "ACTIVE" : "OFF"} status={latched ? "fire" : "idle"} />
                <Block x={950} y={300} w={190} h={60} title="SMART SYSTEM" sub="Cloud · SMS · BMS" val={notified ? "NOTIFIED" : "STANDBY"} status={notified ? "fire" : "idle"} />

                {/* PANEL LEDs */}
                <Block x={950} y={390} w={190} h={70} title="PANEL STATUS" sub="FACP front LEDs" status={latched ? "fire" : "ok"} />
                <circle cx={972} cy={412} r={5} fill={latched ? "#ef4444" : "rgba(0,0,0,0.12)"} className={latched ? "rc-led" : ""} />
                <circle cx={1000} cy={412} r={5} fill={fault ? "#f59e0b" : "rgba(0,0,0,0.12)"} className={fault ? "rc-led" : ""} />
                <circle cx={1028} cy={412} r={5} fill={silenced ? "#3b82f6" : "rgba(0,0,0,0.12)"} />
                <circle cx={1056} cy={412} r={5} fill={"#16a34a"} />
                <text x={980} y={438} fontSize={8.5} fill="#9A9A9A" fontFamily="system-ui">FIRE</text>
                <text x={1006} y={438} fontSize={8.5} fill="#9A9A9A" fontFamily="system-ui">FLT</text>
                <text x={1032} y={438} fontSize={8.5} fill="#9A9A9A" fontFamily="system-ui">SIL</text>
                <text x={1058} y={438} fontSize={8.5} fill="#9A9A9A" fontFamily="system-ui">PWR</text>
                <text x={982} y={452} fontSize={8.5} fontWeight={700} fill={latched ? "#ef4444" : "#16a34a"} fontFamily="ui-monospace,monospace">
                  {latched ? "FIRE ALARM" : "STANDBY"}
                </text>

                {/* LCD */}
                <rect x={950} y={490} width={190} height={90} rx={10} fill="#0f172a" stroke="rgba(0,0,0,0.2)" />
                <text x={960} y={510} fontSize={9} fontWeight={800} fill="#7dd3fc" fontFamily="ui-monospace,monospace">FACP · ADDRESSABLE</text>
                <text x={960} y={526} fontSize={9} fill="#e2e8f0" fontFamily="ui-monospace,monospace">
                  {latched ? "ZONE 1/2 FIRE EVENT" : "ALL SYSTEMS NORMAL"}
                </text>
                <text x={960} y={542} fontSize={9} fill="#94a3b8" fontFamily="ui-monospace,monospace">
                  {latched ? `DET: ${heatFixed ? "HEAT" : smokeDetect ? "SMOKE" : flameOn ? "FLAME" : "MCP"} · T ${tempC.toFixed(1)}C` : `TEMP ${tempC.toFixed(1)}C · BAT 100%`}
                </text>
                <text x={960} y={558} fontSize={9} fill={anyDetect && !latched ? "#fbbf24" : "#94a3b8"} fontFamily="ui-monospace,monospace">
                  {phase === "prealarm" && !latched ? `PRE-ALARM · VERIFY ${verifyLeft}s` : latched ? `LATCHED · ${silenced ? "SILENCED" : "NAC ON"}` : "MONITORING"}
                </text>
                <text x={960} y={574} fontSize={8} fill="#475569" fontFamily="ui-monospace,monospace">LOOP A-D · 4 DEVICES ONLINE</text>
              </svg>
            </div>

            {/* Device map */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SENSORS.map((s) => {
                const st = sensorStatus(s.id);
                return (
                  <div key={s.id} className="rounded-xl border p-2.5" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold" style={{ color: "#2D2D2D" }}>D{s.addr}</span>
                      <span className="w-2 h-2 rounded-full" style={{ background: st === "fire" ? "#ef4444" : st === "warn" ? "#f59e0b" : "#16a34a" }} />
                    </div>
                    <div className="text-[9px] font-semibold truncate" style={{ color: "#6B6B6B" }}>{s.name}</div>
                    <div className="text-[8px] truncate" style={{ color: "#9A9A9A" }}>{s.type}</div>
                    <div className="text-[8px] truncate mt-0.5" style={{ color: "#FF9F4C" }}>{s.zone}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== Right: control + monitoring ===== */}
          <div className="flex flex-col gap-3 min-w-0">
            {/* Sensor input */}
            <div className="rounded-2xl border p-3.5" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Temperature input</span>
                <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold", connected && "rc-led")}
                  style={{ background: connected ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: connected ? "#16a34a" : "#6B6B6B" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? "#16a34a" : "#9A9A9A" }} />
                  {connected ? "REAL SENSOR" : "SIMULATED"}
                </span>
              </div>

              <div className="flex items-end gap-2 mb-2.5">
                <div className="text-3xl font-black font-mono" style={{ color: heatFixed ? "#ef4444" : "#2D2D2D" }}>{tempC.toFixed(1)}<span className="text-base" style={{ color: "#9A9A9A" }}>°C</span></div>
                <div className="flex-1" />
                <button onClick={toggleFire}
                  className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all", fireActive && "rc-pulse")}
                  style={fireActive ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" } : { background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  {fireActive ? "STOP FIRE" : "START FIRE"}
                </button>
              </div>

              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-semibold" style={{ color: "#6B6B6B" }}>Ambient drift speed</span>
                <span className="text-[9px] font-mono" style={{ color: "#FF9F4C" }}>{simSpeed}×</span>
              </div>
              <input type="range" min={0.2} max={3} step={0.1} value={simSpeed} onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#FF9F4C]" disabled={connected} />

              <div className="mt-3 pt-2.5 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <span className="text-[9px] font-semibold block mb-1.5" style={{ color: "#6B6B6B" }}>Manual detector inputs</span>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setFlameOn((v) => !v)}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all"
                    style={{ background: flameOn ? "rgba(239,68,68,0.12)" : "rgba(0,0,0,0.04)", color: flameOn ? "#ef4444" : "#6B6B6B", borderColor: flameOn ? "rgba(239,68,68,0.35)" : "rgba(0,0,0,0.08)" }}>
                    FLAME D3
                  </button>
                  <button onClick={() => setManualOn((v) => !v)}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all"
                    style={{ background: manualOn ? "rgba(239,68,68,0.12)" : "rgba(0,0,0,0.04)", color: manualOn ? "#ef4444" : "#6B6B6B", borderColor: manualOn ? "rgba(239,68,68,0.35)" : "rgba(0,0,0,0.08)" }}>
                    MANUAL D4
                  </button>
                  <button onClick={() => setSmokePct((s) => (s >= smokeThresh ? 0.4 : 6.5))}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all"
                    style={{ background: smokeDetect ? "rgba(239,68,68,0.12)" : "rgba(0,0,0,0.04)", color: smokeDetect ? "#ef4444" : "#6B6B6B", borderColor: smokeDetect ? "rgba(239,68,68,0.35)" : "rgba(0,0,0,0.08)" }}>
                    SMOKE D2
                  </button>
                </div>
                <input type="range" min={0.4} max={8} step={0.1} value={smokePct} onChange={(e) => setSmokePct(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-[#FF9F4C]" />
              </div>
            </div>

            {/* Real sensor connection */}
            <div className="rounded-2xl border p-3.5" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>External real sensor</span>
                <span className={cn("w-2 h-2 rounded-full", connected ? "bg-green-400 animate-pulse" : "bg-red-400")} />
              </div>
              <p className="text-[9.5px] mb-2.5" style={{ color: "#6B6B6B" }}>
                Connect a physical temperature sensor (Arduino/ESP32) over USB Serial or WebSocket. Data maps to the <span className="font-mono" style={{ color: "#FF9F4C" }}>temp</span> channel and drives the whole circuit live.
              </p>
              <div className="flex gap-1.5 mb-2">
                <button onClick={handleSerial} disabled={connected}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-40"
                  style={{ background: "rgba(255,159,76,0.08)", color: "#FF9F4C", borderColor: "rgba(255,159,76,0.25)" }}>
                  USB Serial
                </button>
                <button onClick={handleWS} disabled={connected}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-40"
                  style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", borderColor: "rgba(59,130,246,0.25)" }}>
                  WebSocket
                </button>
                <button onClick={handleDisconnect} disabled={!connected}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-40"
                  style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" }}>
                  Stop
                </button>
              </div>
              <div className="rounded-lg px-2.5 py-1.5 text-[9px] font-mono" style={{ background: "rgba(0,0,0,0.04)", color: "#6B6B6B" }}>
                protocol: <span style={{ color: "#FF9F4C" }}>{"{\"temp\":25.3}"}</span> per line · mapped to 8-bit ADC
              </div>
              <div className="mt-2 flex justify-between text-[9px] font-mono" style={{ color: "#9A9A9A" }}>
                <span>ADC raw: {adcHeat} / 255</span>
                <span>{TEMP_MIN}..{TEMP_MAX}°C range</span>
              </div>
            </div>

            {/* Panel controls */}
            <div className="rounded-2xl border p-3.5" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 rounded-full" style={{ background: "#FF9F4C" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Control panel (FACP)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {([["RESET", doReset, "#16a34a"], ["SILENCE", doSilence, "#3b82f6"], ["TEST", doTest, "#f59e0b"], ["EVAC", () => setSilenced(false), "#ef4444"]] as [string, () => void, string][]).map(([label, fn, color]) => (
                  <button key={label} onClick={fn}
                    className="px-2.5 py-2 rounded-xl text-[10px] font-bold border transition-all hover:brightness-105 active:scale-95"
                    style={{ background: color + "0e", color, borderColor: color + "38" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {led(latched, "#ef4444", "FIRE")}
                {led(fault, "#f59e0b", "FAULT")}
                {led(silenced, "#3b82f6", "SILENCE")}
                {led(true, "#16a34a", "POWER")}
              </div>
              <button onClick={() => setFault((f) => !f)}
                className="mt-2.5 w-full px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                style={{ background: fault ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.04)", color: fault ? "#f59e0b" : "#6B6B6B", borderColor: fault ? "rgba(245,158,11,0.35)" : "rgba(0,0,0,0.08)" }}>
                {fault ? "CLEAR LOOP FAULT" : "SIMULATE LOOP FAULT"}
              </button>
            </div>

            {/* Thresholds */}
            <div className="rounded-2xl border p-3.5" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Detection thresholds</span>
              {[
                { label: "Fixed temp", val: tempThresh, min: 40, max: 90, unit: "°C", set: setTempThresh },
                { label: "Rate of rise", val: rateThresh, min: 4, max: 20, unit: "°/min", set: setRateThresh },
                { label: "Smoke obsc.", val: smokeThresh, min: 0.3, max: 2, unit: "%/m", set: setSmokeThresh },
                { label: "Verify delay", val: verifySecs, min: 2, max: 15, unit: "s", set: setVerifySecs },
              ].map((r) => (
                <div key={r.label} className="mt-2">
                  <div className="flex items-center justify-between text-[9.5px] mb-0.5">
                    <span style={{ color: "#6B6B6B" }}>{r.label}</span>
                    <span className="font-mono font-bold" style={{ color: "#FF9F4C" }}>{typeof r.val === "number" ? r.val.toFixed(r.label === "Rate of rise" ? 1 : 0) : r.val} {r.unit}</span>
                  </div>
                  <input type="range" min={r.min} max={r.max} step={r.label === "Rate of rise" ? 0.1 : 1} value={r.val}
                    onChange={(e) => r.set(r.label === "Rate of rise" ? parseFloat(e.target.value) : parseInt(e.target.value))}
                    className="w-full accent-[#FF9F4C]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Bottom: log + notifications ===== */}
        <div className="grid lg:grid-cols-2 gap-4 px-4 sm:px-6 pb-6">
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <span className="text-[11px] font-bold" style={{ color: "#2D2D2D" }}>Event log</span>
              <button onClick={() => setLog([])} className="text-[9px] font-semibold" style={{ color: "#9A9A9A" }}>CLEAR</button>
            </div>
            <div className="max-h-44 overflow-y-auto rc-scroll p-2">
              {tmpLog.length === 0 && <div className="text-[10px] text-center py-6" style={{ color: "#9A9A9A" }}>No events yet.</div>}
              {tmpLog.map((e, i) => (
                <div key={i} className="flex gap-2 items-start px-2 py-1 rounded-lg hover:bg-black/3">
                  <span className="text-[9px] font-mono shrink-0 mt-px" style={{ color: "#9A9A9A" }}>{new Date(e.t).toLocaleTimeString("en-GB", { hour12: false })}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: e.kind === "fire" ? "#ef4444" : e.kind === "warn" ? "#f59e0b" : e.kind === "ok" ? "#16a34a" : e.kind === "net" ? "#3b82f6" : "#9A9A9A" }} />
                  <span className="text-[10px]" style={{ color: e.kind === "fire" ? "#ef4444" : "#2D2D2D" }}>{e.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <span className="text-[11px] font-bold" style={{ color: "#2D2D2D" }}>Smart notifications</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>{notifs.length}</span>
            </div>
            <div className="max-h-44 overflow-y-auto rc-scroll p-2">
              {tmpNotif.length === 0 && <div className="text-[10px] text-center py-6" style={{ color: "#9A9A9A" }}>Idle. Push/SMS/BMS alerts appear on alarm.</div>}
              {tmpNotif.map((n, i) => (
                <div key={i} className="flex gap-2 items-start px-2 py-1 rounded-lg hover:bg-black/3">
                  <span className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-px" style={{ background: n.kind === "push" ? "rgba(59,130,246,0.12)" : n.kind === "sms" ? "rgba(22,163,74,0.12)" : "rgba(255,159,76,0.12)" }}>
                    {n.kind === "push" ? "📲" : n.kind === "sms" ? "💬" : "🏢"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-bold" style={{ color: "#2D2D2D" }}>{n.to}</span>
                      <span className="text-[8px] font-mono" style={{ color: "#9A9A9A" }}>{new Date(n.t).toLocaleTimeString("en-GB", { hour12: false })}</span>
                    </div>
                    <div className="text-[9.5px] truncate" style={{ color: "#6B6B6B" }}>{n.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
