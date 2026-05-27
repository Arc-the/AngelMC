import { Bot, Mic, Send, SlidersHorizontal, Square, Volume2 } from "lucide-react";
import { RefObject } from "react";
import type { AgentResponse, ProviderStatus } from "../lib/types";

type VoiceAssistantProps = {
  transcript: string;
  setTranscript: (value: string) => void;
  response?: AgentResponse;
  isListening: boolean;
  speechSupported: boolean;
  voiceStatus: string;
  voiceError: string;
  providers: ProviderStatus;
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
  voiceReplyEnabled: boolean;
  setVoiceReplyEnabled: (value: boolean) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onAsk: () => void;
  transcriptRef: RefObject<HTMLTextAreaElement | null>;
};

export function VoiceAssistant({
  transcript,
  setTranscript,
  response,
  isListening,
  speechSupported,
  voiceStatus,
  voiceError,
  providers,
  debugMode,
  setDebugMode,
  voiceReplyEnabled,
  setVoiceReplyEnabled,
  onStartVoice,
  onStopVoice,
  onAsk,
  transcriptRef
}: VoiceAssistantProps) {
  return (
    <section className="min-h-0 rounded-md border border-ops-line bg-ops-panel p-4">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-5 w-5 text-ops-green" />
        <h2 className="text-base font-semibold text-white">Voice Assistant</h2>
      </div>
      <button
        onClick={isListening ? onStopVoice : onStartVoice}
        className={`mb-3 flex w-full items-center justify-center gap-2 rounded-md px-4 py-4 text-base font-semibold transition ${
          isListening ? "bg-ops-red text-white" : "bg-ops-green text-slate-950 hover:bg-emerald-300"
        }`}
      >
        {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        {isListening ? "Stop and Transcribe" : "Start Voice Input"}
      </button>
      <p className="mb-3 text-xs text-slate-400">
        {providers.elevenLabsSpeechToTextConfigured
          ? "Records browser microphone audio and sends it to ElevenLabs speech-to-text."
          : "ElevenLabs speech-to-text is not configured. Focus the transcript capture field and use manual dictation."}
      </p>
      <div className="mb-3 rounded-md border border-ops-line bg-ops-panel2 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs uppercase text-slate-500">Transcript</span>
          <span className="text-xs text-slate-400">{speechSupported ? voiceStatus : "Voice capture unavailable in this browser."}</span>
        </div>
        <p className="min-h-16 text-sm leading-6 text-white">{transcript || "Voice transcript will appear here."}</p>
      </div>
      {voiceError ? <p className="mb-3 rounded-md border border-ops-amber/40 bg-ops-amber/10 p-3 text-xs text-amber-100">{voiceError}</p> : null}
      <label className="mb-3 flex items-center justify-between gap-3 rounded-md border border-ops-line bg-ops-panel2 px-3 py-2 text-sm text-slate-300">
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          Debug transcript edit
        </span>
        <input
          type="checkbox"
          checked={debugMode}
          onChange={(event) => setDebugMode(event.target.checked)}
          className="h-4 w-4 accent-ops-cyan"
        />
      </label>
      <textarea
        ref={transcriptRef}
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
        readOnly={!debugMode && providers.elevenLabsSpeechToTextConfigured}
        placeholder="Dictated transcript appears here."
        className={`mb-3 min-h-24 w-full resize-none rounded-md border border-ops-line bg-ops-panel2 p-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-ops-cyan ${
          debugMode || !providers.elevenLabsSpeechToTextConfigured ? "block" : "sr-only"
        }`}
      />
      <div className="mb-4 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={voiceReplyEnabled}
            onChange={(event) => setVoiceReplyEnabled(event.target.checked)}
            className="h-4 w-4 accent-ops-green"
          />
          Voice reply
        </label>
        <button
          onClick={onAsk}
          disabled={!transcript.trim()}
          className="flex items-center gap-2 rounded-md bg-ops-cyan px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Ask Assistant
        </button>
      </div>
      {response ? (
        <div className="rounded-md border border-ops-line bg-ops-panel2 p-4">
          <div className="mb-3 flex items-center gap-2 text-ops-green">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Suggested spoken instruction</span>
          </div>
          <p className="mb-4 text-base font-medium text-white">{response.suggestedSpokenInstruction}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Situation</dt>
              <dd className="text-slate-200">{response.situation}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Blueprint Path</dt>
              <dd className="font-mono text-ops-cyan">{response.blueprintPath}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Next Safe Checks</dt>
              <dd>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-slate-200">
                  {response.nextSafeChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ol>
              </dd>
            </div>
            {response.safetyWarning ? <p className="rounded-md border border-ops-red/50 bg-ops-red/10 p-3 text-rose-100">{response.safetyWarning}</p> : null}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
