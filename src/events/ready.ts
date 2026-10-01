import { Events } from "discord.js";
import { loadCommands } from "../functions/loadCommands";
import type { BotEvent } from "../functions/loadEvents";
import type { BotClient } from "../types/client";

const ready: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: BotClient) {
    console.log(`Logged in as ${client.user?.tag}`);
    await loadCommands(client);
  },
};

export default ready;
