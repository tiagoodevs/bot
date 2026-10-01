import { Events, type Interaction } from "discord.js";
import { canRun } from "../functions/personnel";
import { respondNotice } from "../functions/reply";
import type { BotEvent } from "../functions/loadEvents";
import type { BotClient } from "../types/client";

const interactionCreate: BotEvent<[Interaction]> = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client: BotClient, interaction: Interaction) {
    if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.warn(`No command registered for "${interaction.commandName}".`);
      return;
    }

    if (!canRun(interaction, command.staffOnly)) {
      await respondNotice(
        interaction,
        "No access",
        "This command is restricted to staff members.",
        { accent: "danger", ephemeral: true },
      );
      return;
    }

    if (typeof command.run === "function") {
      await command.run(interaction);
      return;
    }

    await command.execute(interaction);
  },
};

export default interactionCreate;
