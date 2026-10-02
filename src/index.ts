import { GatewayIntentBits, Partials } from "discord.js";
import { loadEvents } from "./functions/loadEvents";
import { createBotClient } from "./types/client";

const client = createBotClient({
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds],
    partials: [Partials.Channel, Partials.Message],
});

await loadEvents(client);
await client.login(process.env.TOKEN);
