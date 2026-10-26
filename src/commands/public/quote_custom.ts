import {
  ApplicationCommandType,
  AttachmentBuilder,
  ContextMenuCommandBuilder,
  MessageFlags,
  type MessageContextMenuCommandInteraction,
} from "discord.js";
import { renderQuoteCard, QUOTE_FONTS, QUOTE_STYLES } from "../../functions/quote";
import { errorNotice, notice, respond } from "../../functions/reply";
import { Command } from "../../types/command";

export default new Command<MessageContextMenuCommandInteraction>({
  info: new ContextMenuCommandBuilder()
    .setName("Make Quote (Custom)")
    .setType(ApplicationCommandType.Message),
  async execute(interaction: MessageContextMenuCommandInteraction) {
    const message = interaction.targetMessage;

    if (!message) {
      await respond(interaction, {
        components: [notice("Unknown message", "That message is no longer available.", "warning")],
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!message.content.trim()) {
      await respond(interaction, {
        components: [notice("Quote Failed", "This message doesn't seem to have any content.", "warning")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.log("[Command: quote_custom] Failed to defer reply", err);
      await respond(interaction, {
        components: [errorNotice("Could not start", "The interaction expired before I could make the quote.")],
        flags: ["Ephemeral"],
      });
      return;
    }

    // Pick random style and font for fun variety
    const style = QUOTE_STYLES[Math.floor(Math.random() * QUOTE_STYLES.length)];
    const font = QUOTE_FONTS[Math.floor(Math.random() * QUOTE_FONTS.length)];

    try {
      const image = await renderQuoteCard(
        {
          user: message.author,
          content: message.content,
          style,
        },
        font,
      );

      const attachment = new AttachmentBuilder(image, {
        name: `quote-${style}.png`,
        description: `Custom quote from ${message.author.displayName}`,
      });

      await interaction.editReply({
        content: `🎨 Style: \`${style}\` | Font: \`${font}\``,
        files: [attachment],
      });
    } catch (err) {
      console.log("[Command: quote_custom] Error", err);
      await interaction.editReply({
        content: "Something went wrong creating the custom quote.",
      });
    }
  },
});
