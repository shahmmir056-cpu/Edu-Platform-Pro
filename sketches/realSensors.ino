/*
 * Neural Sync — Real Sensor Bridge for Logic Circuit Simulator
 * 
 * Reads sensors and outputs JSON over Serial at 115200 baud.
 * Works with Arduino Uno, Nano, Mega, ESP32, ESP8266.
 * 
 * Wiring guide (Arduino Uno):
 *   DHT22  → Pin 2 (data), 3.3V, GND
 *   LDR    → A0 (voltage divider with 10kΩ to GND)
 *   Ultrasonic TRIG → Pin 9, ECHO → Pin 10
 *   IR     → Pin 3 (digital)
 *   PIR    → Pin 4 (digital)
 *   Button → Pin 5 (digital, INPUT_PULLUP)
 * 
 * Output format (JSON, one line per reading):
 *   {"temp":25.3,"humidity":55.2,"light":512,"ultrasonic":120,"ir":1,"motion":0,"button":1}
 * 
 * Or CSV format:
 *   25.3,55.2,512,120,1,0,1
 * 
 * Connect via:
 *   1. Browser → Serial tab → select COM port → Connect (no server needed)
 *   2. Python bridge: python realSensors.py --port COM3
 *      Then browser → WebSocket → ws://localhost:8765
 */

// === Configuration ===
// Uncomment the sensors you have connected:
#define HAS_DHT22
#define HAS_LDR
#define HAS_ULTRASONIC
#define HAS_IR
#define HAS_PIR
#define HAS_BUTTON

// Pin assignments
#define DHT_PIN     2
#define LDR_PIN     A0
#define TRIG_PIN    9
#define ECHO_PIN    10
#define IR_PIN      3
#define PIR_PIN     4
#define BUTTON_PIN  5

// Timing
#define READ_INTERVAL_MS 100   // Send data every 100ms (10 Hz)
#define SERIAL_BAUD      115200

// === DHT22 minimal driver (no library needed) ===
#ifdef HAS_DHT22
uint8_t dht22_read(uint8_t pin, float &temp, float &hum) {
  uint8_t data[5] = {0,0,0,0,0};
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMs(18);
  digitalWrite(pin, HIGH);
  delayMs(40);
  pinMode(pin, INPUT_PULLUP);
  
  // Wait for response
  unsigned long timeout;
  timeout = micros();
  while (digitalRead(pin) == LOW) if (micros()-timeout > 100) return 1;
  timeout = micros();
  while (digitalRead(pin) == HIGH) if (micros()-timeout > 100) return 1;
  
  // Read 40 bits
  for (int i = 0; i < 40; i++) {
    timeout = micros();
    while (digitalRead(pin) == LOW) if (micros()-timeout > 100) return 1;
    unsigned long h = micros();
    timeout = micros();
    while (digitalRead(pin) == HIGH) if (micros()-timeout > 100) return 1;
    unsigned long l = micros();
    data[i/8] <<= 1;
    if ((l - h) > 40) data[i/8] |= 1;
  }
  
  uint8_t checksum = data[0]+data[1]+data[2]+data[3];
  if (checksum != data[4]) return 1;
  
  hum = (data[0] * 256 + data[1]) / 10.0;
  temp = ((data[2] & 0x7F) * 256 + data[3]) / 10.0;
  if (data[2] & 0x80) temp = -temp;
  return 0;
}

void delayMs(unsigned long ms) {
  unsigned long s = millis();
  while (millis()-s < ms) { /* spin */ }
}
#endif

// === Setup ===
void setup() {
  Serial.begin(SERIAL_BAUD);
  
  #ifdef HAS_LDR
    pinMode(LDR_PIN, INPUT);
  #endif
  #ifdef HAS_ULTRASONIC
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
  #endif
  #ifdef HAS_IR
    pinMode(IR_PIN, INPUT);
  #endif
  #ifdef HAS_PIR
    pinMode(PIR_PIN, INPUT);
  #endif
  #ifdef HAS_BUTTON
    pinMode(BUTTON_PIN, INPUT_PULLUP);
  #endif
  
  // Startup message
  Serial.println("{\"status\":\"ready\"}");
}

// === Main Loop ===
void loop() {
  static unsigned long lastRead = 0;
  if (millis() - lastRead < READ_INTERVAL_MS) return;
  lastRead = millis();
  
  bool first = true;
  Serial.print("{");
  
  // DHT22 — Temperature & Humidity
  #ifdef HAS_DHT22
  {
    float temp, hum;
    if (dht22_read(DHT_PIN, temp, hum) == 0) {
      if (!first) Serial.print(",");
      Serial.print("\"temp\":");
      Serial.print(temp, 1);
      first = false;
      Serial.print(",\"humidity\":");
      Serial.print(hum, 1);
    }
  }
  #endif
  
  // LDR — Ambient Light (0-1023)
  #ifdef HAS_LDR
  {
    int light = analogRead(LDR_PIN);
    if (!first) Serial.print(",");
    Serial.print("\"light\":");
    Serial.print(light);
    first = false;
  }
  #endif
  
  // Ultrasonic — Distance in cm
  #ifdef HAS_ULTRASONIC
  {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    float cm = duration * 0.034 / 2.0;
    if (!first) Serial.print(",");
    Serial.print("\"ultrasonic\":");
    Serial.print(cm, 1);
    first = false;
  }
  #endif
  
  // IR — Obstacle detection (0 or 1)
  #ifdef HAS_IR
  {
    int ir = digitalRead(IR_PIN);
    if (!first) Serial.print(",");
    Serial.print("\"ir\":");
    Serial.print(ir);
    first = false;
  }
  #endif
  
  // PIR — Motion detection (0 or 1)
  #ifdef HAS_PIR
  {
    int motion = digitalRead(PIR_PIN);
    if (!first) Serial.print(",");
    Serial.print("\"motion\":");
    Serial.print(motion);
    first = false;
  }
  #endif
  
  // Button — Push button (0 = pressed, 1 = released, active low)
  #ifdef HAS_BUTTON
  {
    int btn = digitalRead(BUTTON_PIN);
    if (!first) Serial.print(",");
    Serial.print("\"button\":");
    Serial.print(btn == LOW ? 1 : 0);
    first = false;
  }
  #endif
  
  Serial.println("}");
}
