import type { ClientEvents } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { BotClient } from "../types/client";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const EVENTS_DIR = path.join(__dirname, "..", "events");

export interface BotEvent<Args extends unknown[] = any[]> {
  name: keyof ClientEvents;
  once?: boolean;
  execute: (client: BotClient, ...args: Args) => Promise<void> | void;
}

function isEventFile(file: string): boolean {
  return /^[a-zA-Z0-9_.-]+\.[jt]s$/.test(file);
}

export async function loadEvents(client: BotClient): Promise<number> {
  if (!fs.existsSync(EVENTS_DIR)) {
    console.log(`Events directory not found: ${EVENTS_DIR}`);
    return 0;
  }

  const eventFiles = (await fs.promises.readdir(EVENTS_DIR)).filter(isEventFile);

  if (eventFiles.length === 0) {
    console.log("No event files found — nothing to register.");
    return 0;
  }

  const skipped: string[] = [];

  for (const file of eventFiles) {
    const filePath = path.join(EVENTS_DIR, file);
    const { default: event } = (await import(pathToFileURL(filePath).href)) as { default?: BotEvent };

    if (!event?.name || typeof event.execute !== "function") {
      skipped.push(file);
      continue;
    }

    const handler = (...args: any[]) => event.execute(client, ...args);

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }

    console.log(`Loaded event ${file.replace(/\.[jt]s$/, "")}`);
  }

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} event file(s): ${skipped.join(", ")}`);
  }

  return eventFiles.length - skipped.length;
}
