"""
Real Sensor Bridge Server
Reads sensor data from Arduino/ESP32 serial port and broadcasts via WebSocket.

Usage:
  pip install pyserial websockets
  python realSensors.py --port COM3 --baud 115200

Browser connects to ws://localhost:8765 to receive JSON sensor data.
Optional: accepts JSON commands from browser to configure the microcontroller.
"""
import argparse
import asyncio
import json
import sys
import time

try:
    import serial
except ImportError:
    print("Install pyserial: pip install pyserial")
    sys.exit(1)

try:
    import websockets
except ImportError:
    print("Install websockets: pip install websockets")
    sys.exit(1)


def parse_line(line: str) -> dict | None:
    """Parse a line from serial as JSON or CSV."""
    line = line.strip()
    if not line:
        return None
    try:
        data = json.loads(line)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    # Try CSV: "25.3,55.2,1013,512"
    channels = ["temp", "humidity", "pressure", "light", "ultrasonic", "ir",
                "motion", "force", "gas", "current", "strain", "proximity",
                "magnetic", "accelerometer", "gyro", "color", "microphone"]
    parts = line.split(",")
    if len(parts) >= 2 and len(parts) <= len(channels):
        result = {}
        for i, p in enumerate(parts):
            try:
                result[channels[i]] = float(p)
            except ValueError:
                pass
        if result:
            return result
    return None


connected_clients: set = set()


async def serial_reader(ser, broadcast_fn):
    """Read lines from serial and broadcast to all connected clients."""
    loop = asyncio.get_event_loop()
    while True:
        try:
            line = await loop.run_in_executor(None, ser.readline)
            decoded = line.decode("utf-8", errors="ignore").strip()
            if decoded:
                data = parse_line(decoded)
                if data:
                    data["_ts"] = time.time()
                    await broadcast_fn(json.dumps(data))
        except Exception as e:
            print(f"Serial read error: {e}")
            await asyncio.sleep(1)


async def ws_handler(websocket):
    """Handle a single WebSocket client connection."""
    connected_clients.add(websocket)
    print(f"Client connected ({len(connected_clients)} total)")
    try:
        async for message in websocket:
            # Forward commands from browser to serial (optional)
            try:
                cmd = json.loads(message)
                if "_command" in cmd:
                    print(f"Command from browser: {cmd}")
                    # Could forward to serial here
            except json.JSONDecodeError:
                pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"Client disconnected ({len(connected_clients)} total)")


async def broadcast(message: str):
    """Send a message to all connected WebSocket clients."""
    if connected_clients:
        await asyncio.gather(*[c.send(message) for c in connected_clients])


async def main(port: str, baud: int, ws_port: int):
    print(f"Opening serial port {port} at {baud} baud...")
    ser = serial.Serial(port, baud, timeout=1)
    print(f"Serial opened: {ser.name}")

    print(f"Starting WebSocket server on ws://localhost:{ws_port}")
    async with websockets.serve(ws_handler, "0.0.0.0", ws_port):
        print("Server running. Press Ctrl+C to stop.")
        await serial_reader(ser, broadcast)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real Sensor Bridge: Serial → WebSocket")
    parser.add_argument("--port", default="COM3", help="Serial port (e.g. COM3, /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate")
    parser.add_argument("--ws-port", type=int, default=8765, help="WebSocket port")
    args = parser.parse_args()
    try:
        asyncio.run(main(args.port, args.baud, args.ws_port))
    except KeyboardInterrupt:
        print("\nStopped.")
