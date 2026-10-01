import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
  type UserContextMenuCommandInteraction,
} from 'discord.js';
import { errorNotice, respond } from "../functions/reply";

/**
 * Every interaction kind a command may handle. Slash commands are the default, so
 * existing commands stay `Command<ChatInputCommandInteraction>` without opting in.
 */
export type AnyCommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

/** The JSON shape a command exposes to the rest of the bot, with the fields we actually read. */
type CommandJson = RESTPostAPIApplicationCommandsJSONBody & {
  name?: string;
  description?: string;
};

/** Normalises a command's `data` into plain JSON, whether it is a builder or a raw object. */
export function commandJson(data: unknown): CommandJson {
  const builder = data as { toJSON?: () => RESTPostAPIApplicationCommandsJSONBody };

  return typeof builder?.toJSON === 'function' ? builder.toJSON() : (data as CommandJson);
}

type DiscordCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | ContextMenuCommandBuilder;

interface CommandOptions<T extends AnyCommandInteraction = ChatInputCommandInteraction> {
  info: DiscordCommandBuilder;
  execute: (interaction: T) => Promise<void>;
  /**
   * Only a default. `loadCommands` overwrites this from the file's location, so a
   * command under `commands/staff` is always staff-only regardless of this value.
   */
  staffOnly?: boolean;
}

export class Command<T extends AnyCommandInteraction = ChatInputCommandInteraction> {
  data: DiscordCommandBuilder;
  execute: (interaction: T) => Promise<void>;
  staffOnly: boolean;

  constructor({ info, execute, staffOnly = false }: CommandOptions<T>) {
    this.data = info;
    this.execute = execute;
    this.staffOnly = staffOnly;
  }

  async run(interaction: T): Promise<void> {
    try {
      await this.execute(interaction);
    } catch (err) {
      console.log(`[Command: ${this.data.name}]`, err);
      await respond(interaction, {
        components: [errorNotice("Something went wrong.", "This command failed unexpectedly. The error has been logged.")],
        flags: ["Ephemeral"],
      });
    }
  }
}
