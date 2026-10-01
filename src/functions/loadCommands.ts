import {
  REST,
  Routes,
  ApplicationIntegrationType,
  InteractionContextType,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { AnyCommandInteraction, Command } from "../types/command";
import { commandJson } from "../types/command";
import type { BotClient } from "../types/client";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const COMMANDS_DIR = path.join(__dirname, "..", "commands");
const STAFF_DIR = path.join(COMMANDS_DIR, "staff");

const UNREGISTERED = new Set(["reload"]);

// Commands get these unless they explicitly set their own integration_types/contexts
// (e.g. staff-only commands that should stay guild-only).
const DEFAULT_INTEGRATION_TYPES = [
  ApplicationIntegrationType.GuildInstall,
  ApplicationIntegrationType.UserInstall,
];

const DEFAULT_CONTEXTS = [
  InteractionContextType.Guild,
  InteractionContextType.BotDM,
  InteractionContextType.PrivateChannel,
];

type CommandFile = {
  data: unknown;
  execute: (interaction: AnyCommandInteraction) => Promise<void>;
  staffOnly?: boolean;
};

function isCommandFile(file: string): boolean {
  return file.endsWith(".ts") && !file.endsWith(".d.ts");
}

async function collectCommandFiles(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) return collectCommandFiles(entryPath);
      if (entry.isFile() && isCommandFile(entry.name)) return [entryPath];

      return [];
    })
  );

  return nested.flat();
}

function withInstallDefaults(
  json: RESTPostAPIApplicationCommandsJSONBody
): RESTPostAPIApplicationCommandsJSONBody {
  if (json.integration_types === undefined) {
    json.integration_types = DEFAULT_INTEGRATION_TYPES;
  }

  if (json.contexts === undefined) {
    json.contexts = DEFAULT_CONTEXTS;
  }

  return json;
}

export async function loadCommands(client: BotClient): Promise<number> {
  const token = process.env.TOKEN;
  const clientId = process.env.CLIENT_ID;

  if (!token || !clientId) {
    const missing = [!token && "TOKEN", !clientId && "CLIENT_ID"].filter(Boolean).join(", ");
    throw new Error(`Cannot load commands, missing environment variable(s): ${missing}`);
  }

  if (!fs.existsSync(COMMANDS_DIR)) {
    throw new Error(`Commands directory not found: ${COMMANDS_DIR}`);
  }

  const files = await collectCommandFiles(COMMANDS_DIR);
  const commandData: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const relativePath = path.relative(COMMANDS_DIR, file);
    const module: { default?: CommandFile } = await import(pathToFileURL(file).href);
    const command = module.default;

    if (!command?.data || typeof command.execute !== "function") {
      skipped.push(relativePath);
      continue;
    }

    const inStaffDir = !path.relative(STAFF_DIR, file).startsWith("..");
    command.staffOnly = inStaffDir;

    const { name } = commandJson(command.data);
    if (!name) {
      skipped.push(relativePath);
      continue;
    }

    client.commands.set(name, command as unknown as Command<AnyCommandInteraction>);

    if (!UNREGISTERED.has(name)) {
      const json = withInstallDefaults(commandJson(command.data));
      commandData.push(json);
    }
  }

  console.log(`Loaded ${client.commands.size} command(s) into the client.`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} file(s): ${skipped.join(", ")}`);
  }

  if (commandData.length === 0) {
    console.log("No commands to register with Discord.");
    return client.commands.size;
  }

  console.log(`Registering ${commandData.length} command(s)...`);

  try {
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(clientId), { body: commandData });
    console.log("Registered commands with Discord.");
  } catch (err) {
    console.log("An error occurred while registering commands", err);
  }

  return client.commands.size;
}