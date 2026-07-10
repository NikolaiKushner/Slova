import Anthropic from "@anthropic-ai/sdk";

// AI card generation is optional: it lights up when ANTHROPIC_API_KEY is set
// (locally in .env, in production via `fly secrets set ANTHROPIC_API_KEY=...`).
// Without a key the endpoints return 503 and the UI hides the AI controls.

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// The workload is mostly single-word translation, so default to the cheapest
// model. Override with e.g. ANTHROPIC_MODEL=claude-opus-4-8 for top quality.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export interface GeneratedCard {
  term: string;
  definition: string;
}

const CARDS_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          definition: { type: "string" },
        },
        required: ["term", "definition"],
        additionalProperties: false,
      },
    },
  },
  required: ["cards"],
  additionalProperties: false,
} as const;

const SYSTEM = `You generate flashcards for a vocabulary-learning app. Each card is a term and its definition (usually a translation). The app's default language pair is English–Russian: terms in English, definitions in Russian. If the user's input is clearly in another language or asks for another pair, follow the input instead. Keep terms in their dictionary form (verbs with "to ...", nouns in singular) and definitions short — a translation plus at most a couple of words of clarification. Never include numbering, quotes, or extra commentary in the fields.`;

// Translations repeat a lot (common words, retyped terms) — cache them so a
// repeated term costs nothing. Process-local, capped, resets on restart.
const translationCache = new Map<string, GeneratedCard[]>();
const TRANSLATION_CACHE_MAX = 1000;

export async function generateCards(options: {
  mode: "topic" | "text" | "translate";
  input: string;
  count: number;
  existingTerms?: string[];
}): Promise<GeneratedCard[]> {
  const { mode, input, count, existingTerms } = options;

  const cacheKey = mode === "translate" ? input.trim().toLowerCase() : null;
  if (cacheKey) {
    const cached = translationCache.get(cacheKey);
    if (cached) return cached;
  }

  const avoid = existingTerms?.length
    ? `\n\nThe set already contains these terms — do not repeat them:\n${existingTerms.join(", ")}`
    : "";

  const prompt =
    mode === "translate"
      ? `Produce exactly one flashcard for this term: "${input}". The definition is its translation (English→Russian, or Russian→English if the term is Russian).`
      : mode === "topic"
        ? `Generate ${count} flashcards of useful vocabulary on the topic: "${input}". Pick words a learner would actually need, from common to less common.${avoid}`
        : `Extract up to ${count} vocabulary flashcards from this text. Pick the words most worth learning (skip trivial words like "the", "is", names). Use each word's dictionary form.\n\nText:\n"""\n${input}\n"""${avoid}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: CARDS_SCHEMA } },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw createError({ statusCode: 422, statusMessage: "The AI declined this request" });
  }

  const text = response.content.find((block) => block.type === "text")?.text ?? "";
  const parsed = JSON.parse(text) as { cards: GeneratedCard[] };
  const result = parsed.cards
    .map((card) => ({ term: card.term.trim(), definition: card.definition.trim() }))
    .filter((card) => card.term && card.definition)
    .slice(0, Math.max(count, 1));

  if (cacheKey && result.length) {
    if (translationCache.size >= TRANSLATION_CACHE_MAX) {
      translationCache.delete(translationCache.keys().next().value!);
    }
    translationCache.set(cacheKey, result);
  }
  return result;
}
