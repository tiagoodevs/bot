import { GatewayIntentBits } from "discord.js";
import { loadEvents } from "./functions/loadEvents";
import { createBotClient } from "./types/client";

const client = createBotClient({
    intents: [GatewayIntentBits.MessageContent]
});

await loadEvents(client);
await client.login(process.env.TOKEN);
