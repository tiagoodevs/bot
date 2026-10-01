import {
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  type CommandInteraction,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
} from "discord.js";

export const Accent = {
  neutral: null,
  success: 0x4dff82,
  danger: 0xff4d4d,
  warning: 0xffac40,
} as const;

type AccentName = keyof typeof Accent;

function toFlagBits(flags: InteractionReplyOptions["flags"]): number[] {
  if (flags === undefined || flags === null) return [];

  return (Array.isArray(flags) ? flags : [flags]).map((flag) =>
    typeof flag === "number" ? flag : MessageFlags[flag as keyof typeof MessageFlags],
  );
}

function componentsV2(options: InteractionReplyOptions): InteractionReplyOptions {
  return { ...options, flags: [MessageFlags.IsComponentsV2, ...toFlagBits(options.flags)] };
}

/**
 * Builds a Components v2 container. `content`/`embeds` are not allowed on messages
 * that set `MessageFlags.IsComponentsV2`, so everything has to live in here.
 */
export function panel(accent: AccentName = "neutral"): ContainerBuilder {
   return accent == "neutral" ? new ContainerBuilder() : new ContainerBuilder().setAccentColor(Accent[accent]);
}

export function notice(
  heading: string,
  body: string,
  accent: AccentName = "neutral",
): ContainerBuilder {
  return panel(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${heading}`))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
}

export function errorNotice(heading: string, body: string): ContainerBuilder {
  return notice(heading, body, "danger");
}

/**
 * Sends a Components v2 reply, transparently falling back to a follow-up when the
 * interaction was already deferred or replied to. The v2 flag is always applied.
 */
export async function respond(
  interaction: CommandInteraction,
  options: InteractionReplyOptions,
): Promise<void> {
  const payload = componentsV2(options);

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload);
    return;
  }

  await interaction.reply(payload);
}

/**
 * Same as {@link respond}, but edits the deferred placeholder instead of adding a new
 * message. Use this for slow work that was acknowledged with `deferReply()`.
 *
 * `Ephemeral` is dropped here because it can only be set on the original reply —
 * pass it to `deferReply()` instead.
 */
export async function respondEdit(
  interaction: CommandInteraction,
  options: InteractionReplyOptions,
): Promise<void> {
  const requested = toFlagBits(options.flags);
  const flags = requested.filter((flag) => flag !== MessageFlags.Ephemeral);
  const payload = componentsV2({ ...options, flags });

  if (interaction.deferred && !interaction.replied) {
    await interaction.editReply(payload as InteractionEditReplyOptions);
    return;
  }

  if (interaction.replied) {
    await interaction.followUp(payload);
    return;
  }

  await interaction.reply(payload);
}

export async function respondNotice(
  interaction: CommandInteraction,
  heading: string,
  body: string,
  options: { accent?: AccentName; ephemeral?: boolean } = {},
): Promise<void> {
  await respond(interaction, {
    components: [notice(heading, body, options.accent)],
    flags: options.ephemeral ? [MessageFlags.Ephemeral] : undefined,
  });
}
