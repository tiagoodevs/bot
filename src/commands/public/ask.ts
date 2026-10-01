import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { ai, AiError, isAiTimeout } from "../../functions/ai";
import { checkCooldown } from "../../functions/cooldown";
import { formatDuration, formatSeconds, truncate } from "../../functions/format";
import { errorNotice, notice, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

const COOLDOWN_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 240_000;

function timeoutMs(): number {
  const parsed = Number(process.env.AI_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export default new Command({
  info: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI a question.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("What would you like to ask?")
        .setRequired(true)
        .setMaxLength(1000),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);

    if (!question.trim()) {
      await respond(interaction, {
        components: [notice("Empty question", "Type something to ask the AI.", "warning")],
        flags: ["Ephemeral"],
      });
      return;
    }

    const remaining = checkCooldown(`ask:${interaction.user.id}`, COOLDOWN_MS);

    if (remaining > 0) {
      await respond(interaction, {
        components: [notice("Slow down", `You can ask again in \`${Math.ceil(remaining / 1000)}s\`.`)],
        flags: ["Ephemeral"],
      });
      return;
    }

    try {
      await interaction.deferReply();
    } catch (err) {
      console.log("[Command: ask] Failed to defer reply", err);
      await respond(interaction, {
        components: [errorNotice("Could not start", "The interaction expired before I could answer.")],
        flags: ["Ephemeral"],
      });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs());

    try {
      const { text, stats } = await ai(question, controller.signal);
      const answer = text || "The model returned an empty answer.";

      const container = new ContainerBuilder().addTextDisplayComponents(txt  => txt.setContent(`### ${question}`))
      .addTextDisplayComponents(txt => txt.setContent(`>>> ${truncate(answer, 1024)}`))
      .addTextDisplayComponents(txt => txt.setContent(`-#  <:gemini:1553788183693762741> Ran using ${stats.model}${stats.latencyMs ? ` · ${formatSeconds(stats.latencyMs)}` : ""}`))

      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      })
    } catch (err: unknown) {
      if (isAiTimeout(err)) {
        await respondEdit(interaction, {
          components: [errorNotice("Timed out", `The model did not reply within ${formatDuration(timeoutMs())}.`)],
        });
        return;
      }

      if (err instanceof AiError) {
        console.log(`[Command: ask] ${err.message}`);
        await respondEdit(interaction, {
          components: [errorNotice("AI unavailable", err.userMessage)],
        });
        return;
      }

      const message = err instanceof Error ? err.message : "Unknown error";
      console.log("[Command: ask] Unexpected error", err);
      await respondEdit(interaction, {
        components: [errorNotice("AI error", message)],
      });
    } finally {
      clearTimeout(timer);
    }
  },
});
