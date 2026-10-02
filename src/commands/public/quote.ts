import {
  ApplicationCommandType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  ContextMenuCommandBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  type MessageContextMenuCommandInteraction,
} from "discord.js";
import { renderQuoteCard } from "../../functions/quote";
import { errorNotice, notice, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

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

    if (!message.content.trim()) {
      await respond(interaction, {
        components: [notice("Quote Failed", "This message doesn't seem to have any content.", "warning")],
        flags: MessageFlags.Ephemeral
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
      content: message.content
    });

    const attachment = new AttachmentBuilder(image, { name: "quote.png", description: `Quote from ${author.displayName}` });

    const embed = new ContainerBuilder()
    .addMediaGalleryComponents(media => media.addItems(item => item.setURL("attachment://quote.png")))
    .addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(comps => comps.addComponents(
      new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("<:Trash:1555508001195167744>")
      .setCustomId(`delete:${message.author.id}:${interaction.user.id}`) // action:userid:moderator
    ))

    await interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2,
        files: [attachment]
    })
  },
});