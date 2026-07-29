// Real Sensor Integration — Web Serial + WebSocket
// Allows connecting physical Arduino/ESP32 sensors to the logic simulator

export type SensorConnectionType = "none" | "serial" | "websocket";
export type SensorChannel = "temp" | "humidity" | "pressure" | "light" | "ultrasonic" | "ir" | "motion" | "gas" | "force" | "accelerometer" | "gyro" | "current" | "color" | "strain" | "proximity" | "magnetic" | "gps" | "rfid" | "fingerprint" | "microphone";

// Mapping from sensor component types to data channels
export const SENSOR_TYPE_MAP: Record<string, SensorChannel> = {
  "temp-sensor": "temp",
  "humidity-sensor": "humidity",
  "pressure-sensor": "pressure",
  "light-sensor": "light",
  "ultrasonic-sensor": "ultrasonic",
  "ir-sensor": "ir",
  "motion-sensor": "motion",
  "gas-sensor": "gas",
  "force-sensor": "force",
  "accelerometer-sensor": "accelerometer",
  "gyro-sensor": "gyro",
  "current-sensor": "current",
  "color-sensor": "color",
  "strain-gauge": "strain",
  "proximity-sensor": "proximity",
  "hall-sensor": "proximity",
  "tilt-sensor": "motion",
  "reed-sensor": "magnetic",
  "magnetic-sensor": "magnetic",
  "bme280": "temp",
  "pir-sensor": "motion",
  "gps-module": "gps",
  "rfid-reader": "rfid",
  "nfc-reader": "rfid",
  "barcode-scanner": "rfid",
  "fingerprint-sensor": "fingerprint",
  "face-recog-cam": "fingerprint",
  "camera-sensor": "fingerprint",
  "microphone-sensor": "microphone",
};

// Available sensor data channels and their bit widths
export const SENSOR_CHANNELS: Record<SensorChannel, { label: string; bits: number; min: number; max: number; unit: string }> = {
  temp:          { label: "Temperature",    bits: 8, min: -10, max: 60,   unit: "°C" },
  humidity:      { label: "Humidity",       bits: 8, min: 0,   max: 100,  unit: "%RH" },
  pressure:      { label: "Pressure",       bits: 8, min: 300, max: 1100, unit: "hPa" },
  light:         { label: "Light",          bits: 8, min: 0,   max: 1000, unit: "lux" },
  ultrasonic:    { label: "Distance",       bits: 8, min: 2,   max: 400,  unit: "cm" },
  ir:            { label: "IR Detect",      bits: 1, min: 0,   max: 1,    unit: "" },
  motion:        { label: "Motion",         bits: 1, min: 0,   max: 1,    unit: "" },
  gas:           { label: "Gas",            bits: 8, min: 0,   max: 1000, unit: "ppm" },
  force:         { label: "Force",          bits: 8, min: 0,   max: 100,  unit: "N" },
  accelerometer: { label: "Accelerometer",  bits: 4, min: -8,  max: 8,    unit: "g" },
  gyro:          { label: "Gyroscope",      bits: 4, min: -250,max: 250,  unit: "°/s" },
  current:       { label: "Current",        bits: 4, min: 0,   max: 5,    unit: "A" },
  color:         { label: "Color",          bits: 4, min: 0,   max: 15,   unit: "" },
  strain:        { label: "Strain",         bits: 4, min: 0,   max: 15,   unit: "" },
  proximity:     { label: "Proximity",      bits: 1, min: 0,   max: 1,    unit: "" },
  magnetic:      { label: "Magnetic",       bits: 1, min: 0,   max: 1,    unit: "" },
  gps:           { label: "GPS",            bits: 8, min: 0,   max: 255,  unit: "" },
  rfid:          { label: "RFID",           bits: 8, min: 0,   max: 255,  unit: "" },
  fingerprint:   { label: "Fingerprint",    bits: 4, min: 0,   max: 15,   unit: "" },
  microphone:    { label: "Microphone",     bits: 8, min: 0,   max: 255,  unit: "" },
};

// Real sensor data store — singleton shared between engine and UI
class RealSensorStore {
  // Channel → raw value from hardware (before bit conversion)
  private channelValues: Map<SensorChannel, number> = new Map();
  // Node ID → assigned channel
  private nodeChannels: Map<string, SensorChannel> = new Map();
  // Connection state
  connectionType: SensorConnectionType = "none";
  connected = false;
  lastUpdate = 0;
  // Callbacks for UI updates
  private listeners: Set<() => void> = new Set();
  // Serial port
  private serialPort: any = null;
  private serialReader: any = null;
  private serialReading = false;
  // WebSocket
  private ws: WebSocket | null = null;
  private wsUrl = "";

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.lastUpdate = Date.now();
    this.listeners.forEach(cb => cb());
  }

  // Map a sensor node to a real data channel
  assignChannel(nodeId: string, channel: SensorChannel) {
    this.nodeChannels.set(nodeId, channel);
    this.notify();
  }

  unassignChannel(nodeId: string) {
    this.nodeChannels.delete(nodeId);
    this.notify();
  }

  getNodeChannel(nodeId: string): SensorChannel | undefined {
    return this.nodeChannels.get(nodeId);
  }

  // Get bit-expanded output for a node based on its assigned channel
  getNodeOutputs(nodeId: string): boolean[] | null {
    const channel = this.nodeChannels.get(nodeId);
    if (!channel) return null;
    const val = this.channelValues.get(channel);
    if (val === undefined) return null;

    const ch = SENSOR_CHANNELS[channel];
    // Map value to 0..(2^bits - 1)
    const range = ch.max - ch.min;
    const normalized = range > 0 ? (val - ch.min) / range : 0;
    const intVal = Math.round(normalized * ((1 << ch.bits) - 1));
    const clamped = Math.max(0, Math.min((1 << ch.bits) - 1, intVal));

    return Array.from({ length: ch.bits }, (_, j) => !!(clamped & (1 << j)));
  }

  // Get formatted value string for display
  getDisplayValue(nodeId: string): string | null {
    const channel = this.nodeChannels.get(nodeId);
    if (!channel) return null;
    const val = this.channelValues.get(channel);
    if (val === undefined) return null;
    const ch = SENSOR_CHANNELS[channel];
    return `${val.toFixed(1)} ${ch.unit}`;
  }

  // Parse incoming data from serial or WebSocket
  // Expected format: JSON object with channel keys
  // e.g. {"temp":25.3,"humidity":55.2,"light":512,"ir":1}
  parseDataLine(line: string) {
    try {
      const data = JSON.parse(line.trim());
      let changed = false;
      for (const [key, val] of Object.entries(data)) {
        if (key in SENSOR_CHANNELS && typeof val === "number") {
          this.channelValues.set(key as SensorChannel, val);
          changed = true;
        }
      }
      if (changed) this.notify();
    } catch {
      // Try CSV format: "temp,humidity,pressure,...\n25.3,55.2,1013,..."
      const parts = line.trim().split(",");
      const channels = Object.keys(SENSOR_CHANNELS) as SensorChannel[];
      if (parts.length >= 2 && parts.length <= channels.length) {
        let changed = false;
        parts.forEach((p, idx) => {
          if (idx < channels.length) {
            const v = parseFloat(p);
            if (!isNaN(v)) {
              this.channelValues.set(channels[idx], v);
              changed = true;
            }
          }
        });
        if (changed) this.notify();
      }
    }
  }

  // ===== Web Serial =====
  async connectSerial() {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial API not supported in this browser. Use Chrome/Edge.");
    }

    try {
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.connectionType = "serial";
      this.connected = true;
      this.serialReading = true;
      this.notify();

      // Start reading loop
      this.readSerialLoop();
    } catch (err: any) {
      this.connected = false;
      this.connectionType = "none";
      this.notify();
      throw err;
    }
  }

  private async readSerialLoop() {
    if (!this.serialPort || !this.serialReading) return;

    try {
      const reader = this.serialPort.readable.getReader();
      this.serialReader = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (this.serialReading) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.substring(0, nlIdx);
          buffer = buffer.substring(nlIdx + 1);
          if (line.startsWith("{")) {
            this.parseDataLine(line);
          }
        }
      }
    } catch (err) {
      console.error("Serial read error:", err);
    } finally {
      this.connected = false;
      this.connectionType = "none";
      this.notify();
    }
  }

  async disconnectSerial() {
    this.serialReading = false;
    if (this.serialReader) {
      try { await this.serialReader.cancel(); } catch {}
      this.serialReader = null;
    }
    if (this.serialPort) {
      try { await this.serialPort.close(); } catch {}
      this.serialPort = null;
    }
    this.connected = false;
    this.connectionType = "none";
    this.notify();
  }

  // ===== WebSocket =====
  connectWebSocket(url: string) {
    this.wsUrl = url;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connectionType = "websocket";
        this.connected = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        this.parseDataLine(event.data);
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.connectionType = "none";
        this.notify();
      };
    } catch (err: any) {
      this.connected = false;
      this.connectionType = "none";
      this.notify();
      throw err;
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.connectionType = "none";
    this.notify();
  }

  disconnect() {
    this.disconnectSerial();
    this.disconnectWebSocket();
  }

  // Set raw channel value (for testing/manual input)
  setChannelValue(channel: SensorChannel, value: number) {
    this.channelValues.set(channel, value);
    this.notify();
  }

  getChannelValue(channel: SensorChannel): number | undefined {
    return this.channelValues.get(channel);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionType(): SensorConnectionType {
    return this.connectionType;
  }
}

// Singleton instance
export const realSensors = new RealSensorStore();
