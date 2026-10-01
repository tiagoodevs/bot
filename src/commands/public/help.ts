import {
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { canRun } from "../../functions/personnel";
import { notice, respond } from "../../functions/reply";
import { Command } from "../../types/command";
import { asBotClient } from "../../types/client";
import { commandJson } from "../../types/command";

const MAX_LISTED = 40;

export default new Command({
  info: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists the commands you can use."),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = asBotClient(interaction.client);

    const visible = [...client.commands.values()]
      .filter((command) => canRun(interaction, command.staffOnly))
      .sort((a, b) => {
        if (a.staffOnly !== b.staffOnly) return a.staffOnly ? 1 : -1;
        return commandJson(a.data).name.localeCompare(commandJson(b.data).name);
      });

    if (visible.length === 0) {
      await respond(interaction, {
        components: [notice("No commands", "Nothing is available to you right now.", "warning")],
        flags: ["Ephemeral"],
      });
      return;
    }

    const listed = visible.slice(0, MAX_LISTED).map((command) => {
      const { name, description } = commandJson(command.data);
      return `- \`/${name}\`${command.staffOnly ? " 🔒" : ""}\n  ${description ?? "No description."}`;
    });

    if (visible.length > MAX_LISTED) {
      listed.push(`-# …and ${visible.length - MAX_LISTED} more.`);
    }

    await respond(interaction, {
      components: [
        notice("Commands", listed.join("\n")),
      ],
    });
  },
});
