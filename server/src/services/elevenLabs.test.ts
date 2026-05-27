import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { synthesizeWithElevenLabs, transcribeWithElevenLabs } from "./elevenLabs.js";

const originalEnv = process.env;

describe("ElevenLabs voice services", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ELEVENLABS_API_KEY: "el_test_key",
      ELEVENLABS_VOICE_ID: "voice_123",
      ELEVENLABS_MODEL_ID: "eleven_multilingual_v2",
      ELEVENLABS_STT_MODEL_ID: "scribe_v2"
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("sends microphone audio to ElevenLabs speech-to-text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Where is the breaker for Projector B?" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeWithElevenLabs(Buffer.from("wav-bytes"));

    expect(result).toEqual({
      ok: true,
      provider: "elevenlabs",
      transcript: "Where is the breaker for Projector B?"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/speech-to-text",
      expect.objectContaining({
        method: "POST",
        headers: { "xi-api-key": "el_test_key" },
        body: expect.any(FormData)
      })
    );

    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.get("model_id")).toBe("scribe_v2");
    expect(formData.get("file")).toBeInstanceOf(Blob);
  });

  it("sends assistant replies to ElevenLabs text-to-speech", async () => {
    const audio = new ArrayBuffer(4);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => audio,
      headers: new Headers({ "content-type": "audio/mpeg" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await synthesizeWithElevenLabs("Go to the AV Booth first.");

    expect(result).toEqual({ ok: true, audio, contentType: "audio/mpeg" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/text-to-speech/voice_123",
      expect.objectContaining({
        method: "POST",
        headers: {
          "xi-api-key": "el_test_key",
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
        }
      })
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { text: string; model_id: string };
    expect(body.text).toBe("Go to the AV Booth first.");
    expect(body.model_id).toBe("eleven_multilingual_v2");
  });

  it("returns unavailable results when ElevenLabs credentials are absent", async () => {
    process.env.ELEVENLABS_API_KEY = "";
    process.env.ELEVENLABS_VOICE_ID = "";

    const stt = await transcribeWithElevenLabs(Buffer.from("wav-bytes"));
    const tts = await synthesizeWithElevenLabs("Hello");

    expect(stt.ok).toBe(false);
    expect(tts.ok).toBe(false);
  });
});
