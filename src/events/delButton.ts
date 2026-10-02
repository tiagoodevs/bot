import {
  Colors,
  ContainerBuilder,
  Events,
  MessageFlags,
  type Interaction,
} from "discord.js";
import type { BotEvent } from "../functions/loadEvents";
import type { BotClient } from "../types/client";

const interactionCreate: BotEvent<[Interaction]> = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client: BotClient, interaction: Interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("delete:")) return;

    const [, quotee, quoter] = interaction.customId.split(":");

    const isAllowed =
      interaction.user.id === quotee || interaction.user.id === quoter;

    if (!isAllowed) {
      const errorContainer = new ContainerBuilder()
        .addTextDisplayComponents((text) =>
          text.setContent(
            "### Action Failed\nYou're not the quoter or the quotee of this message, therefore you cannot delete it."
          )
        )
        .setAccentColor(Colors.Red);

      await interaction.reply({
        components: [errorContainer],
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      });
      return;
    }

    const deletedContainer = new ContainerBuilder().addTextDisplayComponents(
      (text) =>
        text.setContent(
          `<:redTrash:1555512096689627246> ${interaction.user.username} deleted the quote`
        )
    );

    await interaction.update({
      components: [deletedContainer],
    });
  },
};

export default interactionCreate;