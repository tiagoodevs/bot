import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  TimestampStyles,
  time,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { notice, panel, respond } from "../../functions/reply";
import { Command } from "../../types/command";

export default new Command<UserContextMenuCommandInteraction>({
  info: new ContextMenuCommandBuilder()
    .setName("User Info")
    .setType(ApplicationCommandType.User),
  async execute(interaction: UserContextMenuCommandInteraction) {
    const user = interaction.targetUser;

    if (!user) {
      await respond(interaction, {
        components: [notice("Unknown user", "That user is no longer available.", "warning")],
        flags: ["Ephemeral"],
      });
      return;
    }

    const name = user.displayName;

    const fields = [
      ["Username", user.username],
      ["Display name", name],
      ["ID", user.id],
      ["Account created", time(user.createdTimestamp, TimestampStyles.LongDateTime)],
      ["Bot account", user.bot ? "Yes" : "No"],
    ]
      .map(([label, value]) => `**${label}** — ${value}`)
      .join("\n");

    const container = panel("neutral")
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${name}`))
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(user.displayAvatarURL({ size: 1024 }))
              .setDescription(name),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(fields));

    await respond(interaction, {
      components: [container],
      flags: ["Ephemeral"],
    });
  },
});
