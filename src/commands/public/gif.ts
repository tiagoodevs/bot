import {
  AttachmentBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { convertToGif } from "../../functions/gif";
import { errorNotice, notice, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

export default new Command({
  info: new SlashCommandBuilder()
    .setName("gif")
    .setDescription("Convert an image/attachment to a trippy animated GIF!")
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("Image to convert").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("frames")
        .setDescription("Number of frames (4-20)")
        .setMinValue(4)
        .setMaxValue(20),
    )
    .addIntegerOption((option) =>
      option
        .setName("fps")
        .setDescription("Frames per second (5-15)")
        .setMinValue(5)
        .setMaxValue(15),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const attachment = interaction.options.getAttachment("image", true);
    const frames = interaction.options.getInteger("frames") ?? 12;
    const fps = interaction.options.getInteger("fps") ?? 10;

    if (!attachment.contentType?.startsWith("image/")) {
      await respond(interaction, {
        components: [notice("Invalid file", "Please attach an image!", "warning")],
        flags: ["Ephemeral"],
      });
      return;
    }

    try {
      await interaction.deferReply();
    } catch (err) {
      console.log("[Command: gif] Failed to defer reply", err);
      await respond(interaction, {
        components: [errorNotice("Could not start", "The interaction expired before I could convert.")],
        flags: ["Ephemeral"],
      });
      return;
    }

    try {
      const gif = await convertToGif(attachment.url, { frames, fps });
      const file = new AttachmentBuilder(gif, { name: "converted.gif" });
      await interaction.editReply({
        files: [file],
      });
    } catch (err) {
      console.log("[Command: gif] Error", err);
      await respondEdit(interaction, {
        components: [errorNotice("Conversion failed", "Something went wrong while converting to GIF.")],
      });
    }
  },
});
