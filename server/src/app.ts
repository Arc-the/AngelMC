import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { agentRouter } from "./routes/agent.js";
import { incidentsRouter } from "./routes/incidents.js";
import { reportsRouter } from "./routes/reports.js";
import { sessionRouter } from "./routes/session.js";
import { sttRouter } from "./routes/stt.js";
import { ttsRouter } from "./routes/tts.js";
import { isElevenLabsConfigured, isElevenLabsSpeechToTextConfigured } from "./services/elevenLabs.js";
import type { SessionContext } from "./types.js";

dotenv.config();

export const app = express();

app.locals.sessions = new Map<string, SessionContext>();

app.use(cors());
app.use("/api/stt", sttRouter);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    providers: {
      elevenLabsSpeechToTextConfigured: isElevenLabsSpeechToTextConfigured(),
      elevenLabsTextToSpeechConfigured: isElevenLabsConfigured(),
      modelConfigured: Boolean(process.env.MODEL_API_KEY && process.env.MODEL_NAME)
    }
  });
});

app.use("/api/session", sessionRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/agent", agentRouter);
app.use("/api/tts", ttsRouter);
app.use("/api/reports", reportsRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "AngelMC backend error" });
});

export default app;
