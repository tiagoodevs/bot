import { Client, Collection, type ClientOptions } from "discord.js";
import type { AnyCommandInteraction, Command } from "./command";

export type BotClient = Omit<Client, "commands"> & {
  commands: Collection<string, Command<AnyCommandInteraction>>;
};

export function createBotClient(options: ClientOptions): BotClient {
  const client = new Client(options) as unknown as BotClient;
  client.commands = new Collection();

  return client;
}

/** Narrows discord.js's `Client` back to the bot's `BotClient` inside command handlers. */
export function asBotClient(client: Client | BotClient): BotClient {
  return client as unknown as BotClient;
}
