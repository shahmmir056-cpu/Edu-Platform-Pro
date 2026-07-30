export type GateType =
  // === Input Controls (existing) ===
  | "const-0" | "const-1" | "toggle" | "button" | "clock"
  | "dip-switch" | "keypad" | "analog-in" | "random" | "push-button"
  // === Input Controls (new) ===
  | "pulse-gen" | "edge-det" | "edge-det-f" | "voltage-src-4" | "data-bus-in"
  | "addr-input" | "step-input" | "status-in" | "control-in" | "strobe-in"
  | "ready-in" | "ack-in" | "busy-in" | "interrupt-in" | "dma-in"
  | "hold-in" | "bus-req-in" | "test-mode" | "enable-all" | "global-reset"
  // === Output Controls (existing) ===
  | "bulb" | "hex-display" | "led" | "7-segment" | "buzzer" | "bar-graph"
  // === Output Controls (new) ===
  | "tri-led" | "stepper-motor" | "servo-motor" | "lcd-display" | "status-led"
  | "traffic-light" | "digit-display" | "dot-matrix" | "scope-output" | "indicator-panel"
  | "seven-seg-4" | "ascii-display" | "signal-analyzer" | "voltmeter" | "ammeter"
  | "clock-display" | "thermometer-out" | "tachometer" | "power-meter" | "data-latch-disp"
  // === Logic Gates (existing) ===
  | "buffer" | "not" | "and" | "nand" | "or" | "nor" | "xor" | "xnor"
  | "xor3" | "xnor3" | "nand3" | "nor3" | "or3"
  | "aoi" | "oai" | "ao" | "buffer-inv" | "mux2-inv"
  // === Logic Gates (new - 3/4/5/6/8 input variants) ===
  | "and3" | "and4" | "and5" | "and6" | "and8"
  | "or4" | "or5" | "or6" | "or8"
  | "nand4" | "nand5" | "nand6" | "nand8"
  | "nor4" | "nor5" | "nor6" | "nor8"
  | "xor4" | "xor5" | "xor6" | "xor8"
  | "xnor4" | "xnor5" | "xnor6" | "xnor8"
  // === Logic Gates (new - buffer/not variants) ===
  | "buffer2" | "buffer4" | "not2" | "not4"
  // === Logic Gates (new - compound) ===
  | "and-or-inv" | "or-and" | "or-and-inv" | "aoai" | "oaoi"
  | "majority" | "parity3" | "tri-state" | "tri-state-inv" | "open-drain"
  // === Combinational (existing) ===
  | "half-adder" | "full-adder"
  | "half-subtractor" | "full-subtractor"
  | "mux2" | "mux4" | "decoder"
  | "dec-2to4" | "prio-enc-4to2" | "full-comp" | "cla-unit"
  // === Combinational (new - arithmetic) ===
  | "adder-4bit" | "adder-8bit" | "subtractor-4bit" | "subtractor-8bit"
  | "multiplier-4bit" | "multiplier-8bit" | "divider-4bit"
  | "comparator-4bit" | "comparator-8bit"
  | "cla-adder-4" | "carry-select-4" | "kogge-stone-4" | "brent-kung-4"
  | "wallace-mul-4" | "booth-mul-4"
  // === Combinational (new - MUX/DEMUX) ===
  | "mux8" | "mux16"
  | "demux1to2" | "demux1to4" | "demux1to8"
  // === Combinational (new - encoder/decoder) ===
  | "encoder-8to3" | "encoder-16to4"
  | "prio-encoder-8to3" | "prio-encoder-16to4"
  | "decoder-3to8" | "decoder-4to16"
  // === Combinational (new - code converters) ===
  | "bcd-to-binary" | "binary-to-bcd" | "bcd-to-7seg"
  | "gray-to-binary" | "binary-to-gray"
  // === Combinational (new - ALU/building blocks) ===
  | "alu-4bit" | "alu-8bit"
  | "sign-ext-4to8" | "zero-ext-4to8"
  | "bit-reverse-4" | "byte-swap-16"
  // === Combinational (new - shift/rotate) ===
  | "shift-left-4" | "shift-right-4" | "arith-shift-right-4"
  | "rotate-left-4" | "rotate-right-4"
  | "barrel-shifter-4" | "barrel-shifter-8"
  // === Combinational (new - bit manipulation) ===
  | "popcount-8" | "leading-zeros-8" | "trailing-zeros-8"
  | "mask-gen-4" | "abs-value-8" | "negate-8"
  | "sqrt-approx-4" | "log2-approx"
  | "min-2" | "max-2" | "clamp-8" | "saturate-8"
  // === Combinational (new - error correction) ===
  | "parity-check-8" | "parity-gen-valid"
  | "hamming-enc-4" | "hamming-dec-7"
  | "crc-gen-4" | "crc-check-4" | "checksum-4"
  // === Combinational (new - data path) ===
  | "lfsr-4" | "bit-slice-4" | "width-conv-4to8"
  | "par-to-serial" | "serial-to-par"
  | "crossbar-4x4" | "arbiter-4"
  | "mux-tree" | "inverter-bank-4" | "buffer-bank-4"
  | "and-bank-4" | "or-bank-4" | "xor-bank-4"
  | "nand-bank-4" | "nor-bank-4" | "constant-bank-4"
  // === Combinational (new - misc) ===
  | "sqrt-8" | "cbrt-approx" | "factorial-4"
  | "gray-counter-dec" | "thermometer-code" | "excess-3"
  // === Sequential (existing) ===
  | "d-latch" | "d-flipflop" | "t-flipflop" | "sr-latch" | "jk-flipflop"
  | "reg-4bit"
  // === Sequential (new - flip-flop variants) ===
  | "d-ff-rst" | "d-ff-set" | "d-ff-rst-set" | "d-ff-en" | "d-ff-clk-en"
  | "t-ff-rst" | "t-ff-en"
  | "jk-ff-rst" | "jk-ff-en" | "jk-ff-clk-en"
  | "sr-ff" | "sr-ff-rst" | "ms-ff"
  // === Sequential (new - registers) ===
  | "reg-8bit" | "reg-16bit" | "reg-32bit"
  | "shadow-reg" | "backup-reg" | "pipeline-stage"
  // === Sequential (new - shift registers) ===
  | "siso-8" | "sipo-8" | "piso-8" | "pipo-8" | "sipo-en"
  // === Sequential (new - counters) ===
  | "counter-up-4" | "counter-down-4" | "counter-updown-4" | "counter-up-8"
  | "counter-mod10" | "counter-mod6" | "counter-mod12" | "counter-mod16"
  | "counter-load-4" | "counter-en-4"
  // === Sequential (new - ring/johnson) ===
  | "johnson-4" | "ring-4" | "johnson-8" | "ring-8"
  // === Sequential (new - LFSR) ===
  | "lfsr-8" | "lfsr-16" | "lfsr-max-8"
  // === Sequential (new - dividers) ===
  | "freq-div-2" | "freq-div-4" | "freq-div-8" | "freq-div-10"
  // === Sequential (new - timing) ===
  | "one-shot" | "retriggerable-one-shot" | "debounce"
  | "pulse-stretcher" | "delay-1" | "delay-4" | "delay-8"
  // === Sequential (new - synchronization) ===
  | "sync-2ff" | "sync-3ff" | "edge-det-rising-seq" | "edge-det-falling-seq"
  // === Sequential (new - FIFO/stack/buffer) ===
  | "fifo-4" | "fifo-8" | "stack-4" | "circ-buf-4"
  // === Sequential (new - state machines) ===
  | "fsm-4" | "seq-det-101" | "seq-det-1101" | "parity-fsm"
  // === Sequential (new - controllers) ===
  | "traffic-ctrl" | "vending-ctrl" | "bus-arbiter-seq" | "bus-arbiter-pri"
  // === Sequential (new - handshake) ===
  | "handshake-init" | "handshake-resp"
  // === Sequential (new - programmable divider) ===
  | "clk-div-prog" | "timer-4" | "stopwatch-ctrl"
  // === Sequential (new - memory) ===
  | "ram-4x4" | "rom-8x4" | "rom-16x8"
  | "ram-rd-port" | "ram-wr-port"
  | "reg-file-4x4" | "reg-file-8x8"
  | "state-mem" | "history-reg"
  // === Sequential (new - processor support) ===
  | "hazard-flush" | "exception-reg" | "interrupt-reg"
  | "context-save" | "context-restore" | "branch-predict"
  | "return-stack" | "icache-lookup"
  | "dtlb-entry" | "page-table-entry"
  // === Sequential (new - UART/SPI/I2C) ===
  | "uart-tx" | "uart-rx" | "bitbang-tx" | "bitbang-rx"
  | "spi-master" | "spi-slave" | "i2c-master" | "i2c-slave"
  // === Communication (new) ===
  | "clk-recovery" | "baud-gen" | "tx-mux" | "rx-demux"
  | "scrambler" | "descrambler" | "manchester-enc" | "manchester-dec"
  | "nrz-enc" | "nrz-dec" | "pipeline-reg-stage"
  // === Signal Processing (new) ===
  | "hazard-filter" | "glitch-det" | "metastab-filter"
  | "clk-gate" | "io-pad" | "level-shift" | "schmitt-trigger"
  | "sample-hold" | "peak-det" | "zero-cross" | "phase-det"
  | "charge-pump" | "digital-pot"
  // === Bus/Interface (new) ===
  | "data-mux" | "addr-decode" | "wait-state-gen" | "bus-driver"
  | "bus-transceiver" | "bus-buffer" | "bus-holder" | "tri-state-bus"
  | "dma-controller" | "bus-bridge"
  // === Memory Systems (new) ===
  | "clock-domain-crossing" | "async-fifo" | "dual-port-ram"
  | "multi-port-reg" | "shared-reg" | "atomic-reg"
  | "lock-free-queue" | "message-fifo" | "event-queue"
  // === Advanced (new) ===
  | "interrupt-controller" | "dma-channel" | "bus-monitor"
  | "protocol-decoder" | "bit-time-gen" | "frame-gen" | "frame-check"
  | "reorder-buffer" | "reservation-station" | "load-store-queue"
  | "prefetch-buffer" | "cache-valid-bit"
  // === Sensors ===
  | "temp-sensor" | "humidity-sensor" | "pressure-sensor" | "light-sensor"
  | "ir-sensor" | "ultrasonic-sensor" | "motion-sensor" | "accelerometer-sensor"
  | "gyro-sensor" | "magnetic-sensor" | "force-sensor" | "proximity-sensor"
  | "hall-sensor" | "gas-sensor" | "camera-sensor" | "microphone-sensor"
  | "gps-module" | "rfid-reader" | "nfc-reader" | "barcode-scanner"
  | "fingerprint-sensor" | "face-recog-cam"
  // === Processors ===
  | "microcontroller" | "cpu-block" | "fpga-block" | "dsp-block" | "npu-block"
  // === Memory Blocks ===
  | "ram-block" | "rom-block" | "eeprom-block" | "flash-block" | "sram-block" | "cache-block"
  // === Communication Blocks ===
  | "uart-block" | "spi-block" | "i2c-block" | "can-bus" | "usb-block"
  | "ethernet-block" | "wifi-block" | "bluetooth-block" | "zigbee-block" | "lora-block"
  | "gsm-module" | "mqtt-block"
  // === Power ===
  | "battery" | "adapter" | "voltage-regulator" | "fuse" | "buck-converter" | "boost-converter"
  | "bms" | "power-switch"
  // === Electronic Components ===
  | "resistor" | "capacitor" | "inductor" | "diode" | "zener-diode"
  | "transistor-bjt" | "transistor-mosfet" | "op-amp" | "crystal-osc" | "transformer"
  // === Actuators ===
  | "dc-motor" | "relay" | "solenoid" | "oled-display" | "speaker"
  | "linear-actuator" | "robotic-arm" | "printer-out"
  // === Boards (Arduino / RPi / ESP / STM) ===
  | "arduino-uno" | "arduino-nano" | "raspberry-pi" | "raspberry-pi-pico"
  | "esp32" | "stm32"
  // === Advanced Processors ===
  | "gpu-block"
  // === Advanced Sensors ===
  | "bme280" | "pir-sensor" | "current-sensor" | "color-sensor"
  | "strain-gauge" | "tilt-sensor" | "reed-sensor"
  // === Advanced Actuators ===
  | "esc" | "motor-driver" | "robotic-arm-6dof" | "pneumatic-cylinder"
  // === Advanced Electronic ===
  | "mosfet-driver" | "relay-module"
  // === Robotics ===
  | "wheel-mecanum" | "wheel-omni" | "chassis-frame"
  | "industrial-6axis" | "scara-arm" | "delta-robot"
  | "gripper" | "gripper-3f" | "encoder" | "lidar" | "imu" | "gps-rtk"
  | "bluetooth-rc" | "wifi-rc" | "pid-controller" | "kinematic-solver"
  | "path-planner" | "collision-detector" | "gimbal" | "rover-diff"
  | "tracked-base" | "drone-quad" | "flight-ctrl" | "propeller-motor"
  | "linear-guide" | "stepper-nema" | "harmonic-drive" | "lead-screw"
  // === Industrial ===
  | "plc-controller" | "plc-io-module" | "vfd-drive"
  | "servo-drive" | "proximity-switch";

export interface PortDef {
  id: string;
  label: string;
  side: "left" | "right";
}

export interface GateDef {
  type: GateType;
  label: string;
  category: "Input Controls" | "Output Controls" | "Logic Gates" | "Combinational" | "Sequential"
    | "Sensors" | "Processors" | "Memory" | "Communication" | "Power" | "Electronic" | "Actuators"
    | "Robotics" | "Industrial" | "Boards";
  inputs: PortDef[];
  outputs: PortDef[];
  w: number;
  h: number;
}

export interface CircuitNode {
  id: string;
  type: GateType;
  x: number;
  y: number;
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
  state?: unknown;
}

export interface Wire {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface Circuit {
  nodes: CircuitNode[];
  wires: Wire[];
}

export type ThemeId = "dark" | "light" | "forest" | "midnight";

export interface AppTheme {
  id: ThemeId;
  label: string;
  bg: string;
  canvasBg: string;
  gridDot: string;
  sidebar: string;
  toolbar: string;
  panel: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
}

export interface TruthTableRow {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
}

export interface TruthTableResult {
  headers: string[];
  rows: TruthTableRow[];
  inputNodes: CircuitNode[];
  outputNodes: CircuitNode[];
  currentInputs: Record<string, boolean>;
  currentOutputs: Record<string, boolean>;
  activeRowIndex: number;
}

export interface Settings {
  showGrid: boolean;
  theme: ThemeId;
}
