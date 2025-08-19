import os
import io
import time
import requests
import streamlit as st
from gcloud_tts import synthesize_gcloud_tts


ELEVEN_BASE = "https://api.elevenlabs.io/v1"


def get_env() -> dict:
    return {
        "key": os.getenv("ELEVENLABS_API_KEY", ""),
        "agent_pro": os.getenv("ELEVENLABS_AGENT_PRO_ID", ""),
        "agent_con": os.getenv("ELEVENLABS_AGENT_CON_ID", ""),
    }


def call_agent_turn(api_key: str, agent_id: str, text: str) -> bytes | None:
    """Create a ConvAI conversation for the agent, send one user message, return MP3 bytes."""
    headers_json = {"content-type": "application/json", "xi-api-key": api_key}
    try:
        # 1) conversation
        r = requests.post(f"{ELEVEN_BASE}/convai/conversations", json={"agent_id": agent_id}, headers=headers_json, timeout=30)
        if r.status_code != 200:
            st.error(f"Create conversation failed: {r.status_code} {r.text}")
            return None
        conv = r.json()
        conv_id = conv.get("conversation_id") or conv.get("id")
        if not conv_id:
            st.error("No conversation id returned from ElevenLabs")
            return None

        # 2) send message
        r = requests.post(
            f"{ELEVEN_BASE}/convai/conversations/{conv_id}/messages",
            json={"role": "user", "text": text},
            headers=headers_json,
            timeout=30,
        )
        if r.status_code != 200:
            st.error(f"Send message failed: {r.status_code} {r.text}")
            return None

        # 3) fetch audio response
        r = requests.get(
            f"{ELEVEN_BASE}/convai/conversations/{conv_id}/response/audio",
            headers={"accept": "audio/mpeg", "xi-api-key": api_key},
            params={"output_format": "mp3_44100_128"},
            timeout=60,
        )
        if r.status_code != 200:
            st.error(f"Agent audio failed: {r.status_code} {r.text}")
            return None
        audio_bytes = r.content
        content_type = r.headers.get("content-type", "?")
        st.caption(f"ElevenLabs audio: content-type={content_type}, bytes={len(audio_bytes)}")
        return audio_bytes
    except requests.RequestException as e:
        st.error(f"Network error: {e}")
        return None


def check_api_key(api_key: str):
    """Validate the key by calling /v1/user and returning the JSON on success."""
    try:
        r = requests.get(f"{ELEVEN_BASE}/user", headers={"xi-api-key": api_key, "accept": "application/json"}, timeout=15)
        if r.status_code != 200:
            st.error(f"Key check failed: {r.status_code} {r.text}")
            return None
        return r.json()
    except requests.RequestException as e:
        st.error(f"Network error during key check: {e}")
        return None


def main():
    st.set_page_config(page_title="Live Debates (Streamlit)", page_icon="🎙️", layout="centered")
    st.title("Debate with AI")

    env = get_env()
    with st.expander("Connection status", expanded=False):
        st.write({k: ("set" if bool(v) else "missing") for k, v in env.items()})
        if not env["key"]:
            st.warning("Set ELEVENLABS_API_KEY in your environment before running.")
        if st.button("Check ElevenLabs API key", use_container_width=True):
            if not env["key"]:
                st.error("Missing ELEVENLABS_API_KEY")
            else:
                info = check_api_key(env["key"])
                if info:
                    st.success("API key is valid.")
                    st.json(info)

    with st.expander("Quick test", expanded=False):
        st.caption("Runs a single PRO agent turn with a short greeting to verify audio returns.")
        if st.button("Run Agent Hello Test", use_container_width=True):
            if not (env["key"] and env["agent_pro"]):
                st.error("Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_PRO_ID")
            else:
                with st.spinner("Calling PRO agent…"):
                    audio = call_agent_turn(env["key"], env["agent_pro"], "Please greet the audience in one short sentence.")
                if audio:
                    st.success("Received audio from PRO agent")
                    st.audio(io.BytesIO(audio), format="audio/mp3")

    if "pro_text" not in st.session_state:
        st.session_state.pro_text = ""
    if "con_text" not in st.session_state:
        st.session_state.con_text = ""
    if "pro_audio" not in st.session_state:
        st.session_state.pro_audio = None
    if "con_audio" not in st.session_state:
        st.session_state.con_audio = None

    topic = st.text_input("Debate topic", value="Renewable Energy Adoption")
    cols = st.columns(3)
    with cols[0]:
        st.markdown("**PRO**")
    with cols[1]:
        round_num = st.selectbox("Round", options=[1, 2, 3], index=0, label_visibility="collapsed")
        st.caption("Round")
    with cols[2]:
        minutes = st.selectbox("Timer", options=[1, 2, 3], index=0, label_visibility="collapsed")
        st.caption("Minutes")

    left, right = st.columns(2)

    with left:
        st.subheader("PRO")
        st.write("AI")
        st.text_area("Argument", value=st.session_state.pro_text, height=140, key="pro_box")
        if st.button("Generate", key="pro_generate", use_container_width=True):
            st.info("PRO Generate clicked")
            if not (env["key"] and env["agent_pro"] and env["agent_con"]):
                st.error("Missing ElevenLabs env vars. Set ELEVENLABS_API_KEY, ELEVENLABS_AGENT_PRO_ID, ELEVENLABS_AGENT_CON_ID.")
            else:
                # PRO opening then CON rebuttal
                st.info("Generating PRO opening…")
                text_pro = f"Opening for Round {round_num} on {topic}"
                with st.spinner("Waiting for PRO audio…"):
                    audio = call_agent_turn(env["key"], env["agent_pro"], text_pro)
                if audio:
                    st.session_state.pro_audio = audio
                    st.audio(io.BytesIO(audio), format="audio/mp3")
                time.sleep(0.3)
                st.info("Generating CON rebuttal…")
                text_con = f"Rebuttal for Round {round_num} on {topic}"
                with st.spinner("Waiting for CON audio…"):
                    audio2 = call_agent_turn(env["key"], env["agent_con"], text_con)
                if audio2:
                    st.session_state.con_audio = audio2
                    st.audio(io.BytesIO(audio2), format="audio/mp3")

    with right:
        st.subheader("CON")
        st.write("AI")
        st.text_area("Argument", value=st.session_state.con_text, height=140, key="con_box")
        if st.button("Generate", key="con_generate", use_container_width=True):
            st.info("CON Generate clicked")
            if not (env["key"] and env["agent_pro"] and env["agent_con"]):
                st.error("Missing ElevenLabs env vars. Set ELEVENLABS_API_KEY, ELEVENLABS_AGENT_PRO_ID, ELEVENLABS_AGENT_CON_ID.")
            else:
                st.info("Generating PRO opening…")
                text_pro = f"Opening for Round {round_num} on {topic}"
                with st.spinner("Waiting for PRO audio…"):
                    audio = call_agent_turn(env["key"], env["agent_pro"], text_pro)
                if audio:
                    st.session_state.pro_audio = audio
                    st.audio(io.BytesIO(audio), format="audio/mp3")
                time.sleep(0.3)
                st.info("Generating CON rebuttal…")
                text_con = f"Rebuttal for Round {round_num} on {topic}"
                with st.spinner("Waiting for CON audio…"):
                    audio2 = call_agent_turn(env["key"], env["agent_con"], text_con)
                if audio2:
                    st.session_state.con_audio = audio2
                    st.audio(io.BytesIO(audio2), format="audio/mp3")

    st.divider()
    st.caption("Tip: Configure each ElevenLabs Agent to use OpenAI gpt-4o-mini in the ElevenLabs dashboard.")

    with st.expander("Google Cloud TTS test", expanded=False):
        sample = st.text_input("Text", value="Hello from Google Cloud Text to Speech")
        vname = st.text_input("Voice (e.g., en-US-Standard-A)", value="en-US-Standard-A")
        if st.button("Synthesize (GCP)", use_container_width=True):
            audio = synthesize_gcloud_tts(sample, voice_name=vname, language_code=None, audio_encoding="MP3")
            if audio:
                st.success("Received audio from Google TTS")
                st.audio(io.BytesIO(audio), format="audio/mp3")
            else:
                st.error("Google TTS failed. Ensure GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON is set.")


if __name__ == "__main__":
    main()


