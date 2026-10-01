import {
  ApplicationCommandType,
  AttachmentBuilder,
  ContextMenuCommandBuilder,
  SeparatorBuilder,
  type MessageContextMenuCommandInteraction,
} from "discord.js";
import { renderQuoteCard } from "../../functions/quote";
import { errorNotice, notice, panel, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

const FOOTER_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default new Command<MessageContextMenuCommandInteraction>({
  info: new ContextMenuCommandBuilder()
    .setName("Make Quote")
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

    try {
      await interaction.deferReply();
    } catch (err) {
      console.log("[Command: quote] Failed to defer reply", err);
      await respond(interaction, {
        components: [errorNotice("Could not start", "The interaction expired before I could make the quote.")],
        flags: ["Ephemeral"],
      });
      return;
    }

    const author = message.author;
    const image = await renderQuoteCard({
      user: message.author,
      content: message.content || "*No text — this message is only attachments.*",
    });

    const attachment = new AttachmentBuilder(image, { name: "quote.png", description: `Quote from ${author.displayName}` });

    await interaction.editReply({
        files: [attachment]
    })
  },
});