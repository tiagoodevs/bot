import {
  AttachmentBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { renderQuoteCard, QUOTE_FONTS, QUOTE_STYLES } from "../../functions/quote";
import { errorNotice, notice, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

export default new Command({
  info: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Make a quote with custom style and font!")
    .addUserOption((option) => option.setName("user").setDescription("User to quote").setRequired(true))
    .addStringOption((option) => option.setName("text").setDescription("Quote text").setRequired(true).setMaxLength(500))
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("Quote style")
        .addChoices(
          { name: "Classic", value: "classic" },
          { name: "Neon", value: "neon" },
          { name: "Retro", value: "retro" },
          { name: "Bubble", value: "bubble" },
          { name: "Minimal", value: "minimal" },
          { name: "Void", value: "void" },
          { name: "Sunset", value: "sunset" },
          { name: "Cyberpunk", value: "cyberpunk" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("font")
        .setDescription("Font choice")
        .addChoices(
          { name: "Jakarta", value: "jakarta" },
          { name: "Inter", value: "inter" },
          { name: "Slabo", value: "slabo" },
          { name: "VT323", value: "vt323" },
          { name: "Butterfly Kids", value: "butterfly" },
          { name: "System", value: "system" },
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const text = interaction.options.getString("text", true);
    const style = (interaction.options.getString("style") as any) || "classic";
    const font = (interaction.options.getString("font") as any) || "jakarta";

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

    try {
      const image = await renderQuoteCard(
        {
          user,
          content: text,
          style,
        },
        font,
      );

      const attachment = new AttachmentBuilder(image, { name: "quote.png", description: `Quote from ${user.displayName}` });
      await interaction.editReply({
        files: [attachment],
      });
    } catch (err) {
      console.log("[Command: quote_slash] Error", err);
      await respondEdit(interaction, {
        components: [errorNotice("Failed", "Something went wrong creating the quote.")],
      });
    }
  },
});
