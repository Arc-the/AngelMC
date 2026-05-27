import { RadioTower } from "lucide-react";
import type { ProviderStatus } from "../lib/types";

type TopBarProps = {
  providers: ProviderStatus;
};

export function TopBar({ providers }: TopBarProps) {
  const voiceReady = providers.elevenLabsSpeechToTextConfigured && providers.elevenLabsTextToSpeechConfigured;
  const partialReady = providers.elevenLabsSpeechToTextConfigured || providers.elevenLabsTextToSpeechConfigured;
  const providerLabel = voiceReady
    ? "ElevenLabs STT + TTS ready"
    : partialReady
      ? `${providers.elevenLabsSpeechToTextConfigured ? "ElevenLabs STT" : "ElevenLabs TTS"} ready`
      : "Fallback voice mode";

  return (
    <header className="flex flex-col gap-4 border-b border-ops-line bg-ops-panel/90 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-ops-cyan/40 bg-ops-cyan/10">
            <RadioTower className="h-5 w-5 text-ops-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-white">AngelMC</h1>
            <p className="text-sm text-slate-300">Hands-free blueprint and incident support for live event engineers</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md border border-ops-green/40 bg-ops-green/10 px-3 py-2 font-medium text-ops-green">Live Event Mode</span>
        <span className="rounded-md border border-ops-line bg-ops-panel2 px-3 py-2 text-slate-200">FIFA Watch Party - Halftime</span>
        <span className={`rounded-md border px-3 py-2 ${voiceReady ? "border-ops-cyan/40 text-ops-cyan" : "border-ops-amber/40 text-ops-amber"}`}>
          {providerLabel}
        </span>
      </div>
    </header>
  );
}
