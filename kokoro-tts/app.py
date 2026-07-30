import os, io, logging
import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kokoro-tts")

app = FastAPI(title="Kokoro TTS", version="1.0.0")

VOICE = os.environ.get("KOKORO_VOICE", "af_bella")
LANG = os.environ.get("KOKORO_LANG", "a")

pipeline = None

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice: str | None = None

@app.on_event("startup")
def load_model():
    global pipeline
    try:
        from kokoro import KPipeline
        pipeline = KPipeline(lang_code=LANG)
        logger.info("Kokoro model loaded successfully (lang=%s, default_voice=%s)", LANG, VOICE)
    except Exception as e:
        logger.error("Failed to load Kokoro model: %s", e)
        raise

@app.post("/tts")
async def generate_speech(req: TTSRequest):
    if pipeline is None:
        raise HTTPException(503, "TTS model not loaded")

    voice = req.voice or VOICE

    try:
        audio_chunks = []
        for result in pipeline(req.text, voice=voice, speed=1.0):
            audio_chunks.append(result.audio)
    except Exception as e:
        logger.error("Kokoro inference failed: %s", e)
        raise HTTPException(500, f"Kokoro inference failed: {str(e)}")

    if not audio_chunks:
        raise HTTPException(500, "No audio generated")

    try:
        full_audio = np.concatenate(audio_chunks)
    except Exception as e:
        logger.error("Audio concatenation failed: %s", e)
        raise HTTPException(500, "Audio processing failed")

    buf = io.BytesIO()
    try:
        sf.write(buf, full_audio, 24000, format="WAV")
    except Exception as e:
        logger.error("WAV encoding failed: %s", e)
        raise HTTPException(500, "Audio encoding failed")

    wav_bytes = buf.getvalue()
    logger.info("Generated %d bytes of WAV audio for %d chars", len(wav_bytes), len(req.text))
    return Response(content=wav_bytes, media_type="audio/wav")

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": pipeline is not None}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
