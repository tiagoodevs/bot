import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.8-flash";

export type AiStats = {
  model: string;
  /** Wall-clock time for the request. */
  latencyMs?: number | null;
};

export type AiResult = {
  text: string;
  stats: AiStats;
};

/** An AI failure that already has a message worth showing the user. */
export class AiError extends Error {
  readonly userMessage: string;

  constructor(message: string, userMessage: string) {
    super(message);
    this.name = "AiError";
    this.userMessage = userMessage;
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "GEMINI_API_KEY is not set.",
      "This bot has no `GEMINI_API_KEY` configured, so `/ask` is unavailable.",
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

function envNum(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getModel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

/**
 * Gemini 3 thinks by default, and thinking tokens are billed and slow to produce.
 * `AI_THINK` takes `0`/`false` to disable, `-1`/`auto` to let the model decide,
 * or an explicit token budget.
 */
function thinkingBudget(): number {
  const raw = (process.env.AI_THINK ?? "0").toLowerCase();

  if (raw === "true" || raw === "auto" || raw === "-1") return -1;
  if (raw === "false" || raw === "off" || raw === "") return 0;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function describe(err: unknown, model: string): AiError {
  const status = (err as { status?: number })?.status;
  const detail = err instanceof Error ? err.message : String(err);

  if (status === 400 && /api key|API_KEY|permission/i.test(detail)) {
    return new AiError(detail, "The bot's `GEMINI_API_KEY` was rejected. Check that it is valid and enabled.");
  }

  if (status === 403) {
    return new AiError(detail, `Google denied access to \`${model}\`. It may not be available on this API key.`);
  }

  if (status === 429) {
    return new AiError(detail, "Gemini rate limit reached. Try again in a moment.");
  }

  if (status === 404) {
    return new AiError(detail, `Model \`${model}\` was not found. Check the model name.`);
  }

  return new AiError(detail, `Gemini replied with \`${status ?? "an error"}\`.`);
}

export async function ai(prompt: string, signal?: AbortSignal): Promise<AiResult> {
  const model = getModel();
  const systemInstruction = process.env.AI_SYSTEM_PROMPT?.trim();
  const startedAt = Date.now();

  let response;

  try {
    response = await getClient().models.generateContent({
      model,
      contents: prompt,
      config: {
        abortSignal: signal,
        maxOutputTokens: envNum("AI_MAX_TOKENS", 800),
        temperature: envNum("AI_TEMPERATURE", 0.7),
        thinkingConfig: { thinkingBudget: thinkingBudget() },
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });
  } catch (err) {
    if (err instanceof AiError) throw err;
    if (err instanceof Error && (err.name === "AbortError" || /abort/i.test(err.message))) throw err;
    throw describe(err, model);
  }

  const text = response.text?.trim() ?? "";

  if (!text && response.promptFeedback?.blockReason) {
    throw new AiError(
      `Gemini blocked the prompt: ${response.promptFeedback.blockReason}`,
      `Gemini refused that request (${response.promptFeedback.blockReason}).`,
    );
  }

  return { text, stats: { model, latencyMs: Date.now() - startedAt } };
}

export function isAiTimeout(err: unknown): boolean {
  if (err instanceof AiError) return false;

  const { name, message } = (err ?? {}) as { name?: string; message?: string };

  return name === "AbortError" || name === "TimeoutError" || /abort|timed? ?out/i.test(message ?? "");
}
