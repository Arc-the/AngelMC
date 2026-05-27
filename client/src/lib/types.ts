export type IncidentSeverity = "info" | "warning" | "critical";

export type IncidentLog = {
  id: string;
  time: string;
  message: string;
  severity: IncidentSeverity;
  locations: string[];
};

export type AgentResponse = {
  situation: string;
  relevantLocation: string;
  blueprintPath: string;
  nextSafeChecks: string[];
  escalationRule: string;
  suggestedSpokenInstruction: string;
  highlightedLocations: string[];
  relevantAssets: string[];
  safetyWarning?: string;
};

export type SimulatedScenario = "projector_failure" | "network_rack_alert" | "smoke_detector_alert";

export type SessionStartResponse = {
  sessionId: string;
  loadedContextFiles: string[];
};

export type ProviderStatus = {
  elevenLabsSpeechToTextConfigured: boolean;
  elevenLabsTextToSpeechConfigured: boolean;
  modelConfigured: boolean;
};
