import {
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getMinecraftUUID, getSkinUrl, searchMinecraftUser } from "../../functions/minecraft";
import { errorNotice, notice, panel, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

export default new Command({
  info: new SlashCommandBuilder()
    .setName("mc")
    .setDescription("Search for a Minecraft player!")
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Look up a Minecraft user")
        .addStringOption((option) =>
          option.setName("username").setDescription("Minecraft username").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("skin")
        .setDescription("Get a player's skin/avatar")
        .addStringOption((option) =>
          option.setName("username").setDescription("Minecraft username").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of image")
            .addChoices(
              { name: "Avatar", value: "avatar" },
              { name: "Head", value: "head" },
              { name: "Body", value: "body" },
            ),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      await interaction.deferReply();
    } catch (err) {
      console.log("[Command: mc] Failed to defer reply", err);
      await respond(interaction, {
        components: [errorNotice("Could not start", "The interaction expired.")],
        flags: ["Ephemeral"],
      });
      return;
    }

    if (subcommand === "user") {
      const username = interaction.options.getString("username", true);
      const user = await searchMinecraftUser(username);

      if (!user) {
        await respondEdit(interaction, {
          components: [notice("Not found", `No Minecraft user found with the name \`${username}\`.`, "warning")],
        });
        return;
      }

      const uuid = user.id || user.uuid;
      const container = panel("success")
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Minecraft Player Found"))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Username:** ${user.name}\n**UUID:** \`${uuid}\`\n**Profile:** [View on NameMC](https://namemc.com/profile/${uuid})`,
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Requested by ${interaction.user.username}`),
        );

      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    if (subcommand === "skin") {
      const username = interaction.options.getString("username", true);
      const type = (interaction.options.getString("type") as "avatar" | "head" | "body") || "avatar";
      const uuid = await getMinecraftUUID(username);

      if (!uuid) {
        await respondEdit(interaction, {
          components: [notice("Not found", `No Minecraft user found with the name \`${username}\`.`, "warning")],
        });
        return;
      }

      const url = await getSkinUrl(uuid, type);
      const embed = new EmbedBuilder()
        .setTitle(`${username}'s ${type}`)
        .setImage(url)
        .setColor(0x57f287);

      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }
  },
});
