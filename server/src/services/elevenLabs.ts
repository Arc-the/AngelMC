type ElevenLabsResult =
  | { ok: true; audio: ArrayBuffer; contentType: string }
  | { ok: false; reason: string };

type ElevenLabsTranscriptionResult =
  | { ok: true; transcript: string; provider: "elevenlabs" }
  | { ok: false; reason: string; provider: "elevenlabs" };

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

export function isElevenLabsSpeechToTextConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export async function synthesizeWithElevenLabs(text: string): Promise<ElevenLabsResult> {
  if (!isElevenLabsConfigured()) {
    return { ok: false, reason: "ElevenLabs credentials are not configured. Use browser speech synthesis fallback." };
  }

  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.78
      }
    })
  });

  if (!response.ok) {
    return { ok: false, reason: `ElevenLabs request failed with ${response.status}` };
  }

  return {
    ok: true,
    audio: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "audio/mpeg"
  };
}

export async function transcribeWithElevenLabs(audio: Buffer): Promise<ElevenLabsTranscriptionResult> {
  if (!isElevenLabsSpeechToTextConfigured()) {
    return { ok: false, provider: "elevenlabs", reason: "ElevenLabs speech-to-text credentials are not configured." };
  }

  const formData = new FormData();
  formData.append("model_id", process.env.ELEVENLABS_STT_MODEL_ID || "scribe_v2");
  formData.append("language_code", "en");
  formData.append("file_format", "pcm_s16le_16");
  const wavBytes = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
  formData.append("file", new Blob([wavBytes], { type: "audio/wav" }), "audio.wav");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    body: formData
  });

  if (!response.ok) {
    return { ok: false, provider: "elevenlabs", reason: `ElevenLabs speech-to-text request failed with ${response.status}` };
  }

  const payload = (await response.json()) as { text?: string; transcript?: string };
  const transcript = (payload.text || payload.transcript || "").trim();
  if (!transcript) {
    return { ok: false, provider: "elevenlabs", reason: "ElevenLabs speech-to-text returned an empty transcript." };
  }

  return { ok: true, provider: "elevenlabs", transcript };
}
