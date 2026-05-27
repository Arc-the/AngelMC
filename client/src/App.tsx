import { useCallback, useEffect, useRef, useState } from "react";
import { BlueprintMap } from "./components/BlueprintMap";
import { IncidentFeed } from "./components/IncidentFeed";
import { IncidentReport } from "./components/IncidentReport";
import { TopBar } from "./components/TopBar";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { useAudioPlayback } from "./hooks/useAudioPlayback";
import { useVoiceInput } from "./hooks/useVoiceInput";
import { api } from "./lib/api";
import type { AgentResponse, IncidentLog, ProviderStatus, SimulatedScenario } from "./lib/types";

const emptyProviders: ProviderStatus = {
  elevenLabsSpeechToTextConfigured: false,
  elevenLabsTextToSpeechConfigured: false,
  modelConfigured: false
};

export function App() {
  const [sessionId, setSessionId] = useState("");
  const [providers, setProviders] = useState<ProviderStatus>(emptyProviders);
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([]);
  const [highlightedLocations, setHighlightedLocations] = useState<string[]>(["Zone B", "AV Booth", "Electrical Room"]);
  const [transcript, setTranscript] = useState("Where is the breaker for Projector B?");
  const [assistantResponse, setAssistantResponse] = useState<AgentResponse>();
  const [report, setReport] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);
  const playAudio = useAudioPlayback();

  const { isListening, isSupported, status: voiceStatus, error: voiceError, start, stop } = useVoiceInput(setTranscript);

  useEffect(() => {
    void Promise.all([api.startSession(), api.getIncidents(), api.health()]).then(([session, incidents, health]) => {
      setSessionId(session.sessionId);
      setIncidentLogs(incidents.logs);
      setProviders(health.providers);
    });
  }, []);

  const askAssistant = useCallback(async () => {
    if (!sessionId || !transcript.trim()) {
      return;
    }

    const response = await api.askAgent(sessionId, transcript.trim(), incidentLogs);
    setAssistantResponse(response);
    setHighlightedLocations(response.highlightedLocations);
    if (voiceReplyEnabled) {
      await playAudio(response.suggestedSpokenInstruction);
    }
  }, [incidentLogs, playAudio, sessionId, transcript, voiceReplyEnabled]);

  const simulate = useCallback(async (scenario: SimulatedScenario) => {
    const result = await api.simulateIncident(scenario);
    setIncidentLogs(result.logs);
    setHighlightedLocations(result.highlightedLocations);
    if (scenario === "smoke_detector_alert") {
      setTranscript("Smoke alarm near Gate 3, what should I do?");
    }
  }, []);

  const generateReport = useCallback(async () => {
    if (!assistantResponse) {
      return;
    }
    const result = await api.generateReport("Live Event Mode - FIFA Watch Party Halftime", transcript, assistantResponse, incidentLogs);
    setReport(result.report);
  }, [assistantResponse, incidentLogs, transcript]);

  const startVoice = useCallback(async () => {
    transcriptRef.current?.focus();
    if (!(await start())) {
      transcriptRef.current?.focus();
    }
  }, [start]);

  return (
    <div className="min-h-screen bg-ops-bg text-slate-100">
      <TopBar providers={providers} />
      <main className="grid gap-4 p-4 lg:grid-cols-[1.05fr_1fr_1.05fr]">
        <BlueprintMap highlightedLocations={highlightedLocations} safetyWarning={assistantResponse?.safetyWarning} />
        <IncidentFeed logs={incidentLogs} onSimulate={simulate} />
        <VoiceAssistant
          transcript={transcript}
          setTranscript={setTranscript}
          response={assistantResponse}
          isListening={isListening}
          speechSupported={isSupported}
          voiceStatus={voiceStatus}
          voiceError={voiceError}
          providers={providers}
          debugMode={debugMode}
          setDebugMode={setDebugMode}
          voiceReplyEnabled={voiceReplyEnabled}
          setVoiceReplyEnabled={setVoiceReplyEnabled}
          onStartVoice={startVoice}
          onStopVoice={stop}
          onAsk={askAssistant}
          transcriptRef={transcriptRef}
        />
      </main>
      <div className="px-4 pb-4">
        <IncidentReport report={report} onGenerate={generateReport} />
      </div>
    </div>
  );
}
