import {
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../../types/command";
import { panel, respond } from "../../functions/reply";

export default new Command({
  info: new SlashCommandBuilder().setName("ping").setDescription("Replies with pong."),
  async execute(interaction: ChatInputCommandInteraction) {
    const latency = Math.round(interaction.client.ws.ping);

    const container = panel("success")
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("### 🏓 Pong!"))
      .addSeparatorComponents(new SeparatorBuilder().setDivider())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Gateway latency: \`${latency}ms\``),
      );

    await respond(interaction, { components: [container] });
  },
});
