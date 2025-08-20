import os
import json
import tempfile
from typing import Optional


def _ensure_gcp_credentials_from_env() -> None:
    """Allow credentials via either GOOGLE_APPLICATION_CREDENTIALS or inline JSON env."""
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        return
    json_blob = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if not json_blob:
        return
    try:
        data = json.loads(json_blob)
    except json.JSONDecodeError:
        return
    fd, path = tempfile.mkstemp(prefix="gcp_sa_", suffix=".json")
    os.close(fd)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = path


def synthesize_gcloud_tts(
    text: str,
    voice_name: Optional[str] = None,
    language_code: Optional[str] = None,
    speaking_rate: Optional[float] = None,
    pitch: Optional[float] = None,
    audio_encoding: str = "MP3",
) -> Optional[bytes]:
    """Synthesize speech using Google Cloud Text-to-Speech and return audio bytes.

    Env requirements:
      - GOOGLE_APPLICATION_CREDENTIALS (path) OR GOOGLE_APPLICATION_CREDENTIALS_JSON (inline JSON)
    """
    try:
        _ensure_gcp_credentials_from_env()

        # Lazy import to avoid hard dependency at import-time
        from google.cloud import texttospeech  # type: ignore

        client = texttospeech.TextToSpeechClient()

        input_text = texttospeech.SynthesisInput(text=text)

        # Infer language code from voice_name like "en-US-Standard-A" if not provided
        lang = language_code or (voice_name.split("-")[0] + "-" + voice_name.split("-")[1] if voice_name and "-" in voice_name else "en-US")

        voice_params = {
            "language_code": lang,
        }
        if voice_name:
            voice_params["name"] = voice_name

        voice = texttospeech.VoiceSelectionParams(**voice_params)

        encoding_map = {
            "MP3": texttospeech.AudioEncoding.MP3,
            "OGG_OPUS": texttospeech.AudioEncoding.OGG_OPUS,
            "LINEAR16": texttospeech.AudioEncoding.LINEAR16,
        }
        audio_cfg_kwargs = {
            "audio_encoding": encoding_map.get(audio_encoding.upper(), texttospeech.AudioEncoding.MP3),
        }
        if speaking_rate is not None:
            audio_cfg_kwargs["speaking_rate"] = float(speaking_rate)
        if pitch is not None:
            audio_cfg_kwargs["pitch"] = float(pitch)

        audio_config = texttospeech.AudioConfig(**audio_cfg_kwargs)

        response = client.synthesize_speech(
            input=input_text,
            voice=voice,
            audio_config=audio_config,
        )
        return response.audio_content
    except Exception as e:  # Broad by design for UI display
        # Return None so caller can display error
        return None


