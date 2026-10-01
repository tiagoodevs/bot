import {
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  version as djsVersion,
  type ChatInputCommandInteraction,
} from "discord.js";
import { formatBytes, formatDuration } from "../../functions/format";
import { panel, respond } from "../../functions/reply";
import { Command } from "../../types/command";
import { asBotClient } from "../../types/client";

export default new Command({
  info: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Shows statistics about me."),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = asBotClient(interaction.client);
    const { user } = client;

    const stats = [
      ["Servers", client.guilds.cache.size.toLocaleString()],
      ["Commands", client.commands.size.toLocaleString()],
      ["Latency", `${Math.round(client.ws.ping)}ms`],
      ["Uptime", formatDuration(process.uptime() * 1000)],
      ["Memory", formatBytes(process.memoryUsage().heapUsed)],
      ["discord.js", `v${djsVersion}`],
    ]
      .map(([label, value]) => `**${label}** — ${value}`)
      .join("\n");

    const container = panel("neutral")
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### ${user?.username ?? "Unknown"}`),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(user?.displayAvatarURL({ size: 256 }) ?? "")
              .setDescription(user?.username ?? "avatar"),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(stats))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# General purpose bot"),
      );

    await respond(interaction, { components: [container] });
  },
});
