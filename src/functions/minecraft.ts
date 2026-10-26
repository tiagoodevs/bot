export interface MinecraftSkin {
  name: string;
  uuid: string;
  id?: string;
}

export interface MinecraftServerStatus {
  online: boolean;
  players?: { online: number; max: number };
  version?: string;
  motd?: string;
}

export async function searchMinecraftUser(username: string): Promise<MinecraftSkin | null> {
  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data as MinecraftSkin;
  } catch {
    return null;
  }
}

export async function getMinecraftSkinInfo(uuid: string) {
  try {
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getMinecraftUUID(username: string): Promise<string | null> {
  const user = await searchMinecraftUser(username);
  return user?.id ?? user?.uuid ?? null;
}

export async function getSkinUrl(uuid: string, type: "avatar" | "body" | "head" = "avatar"): Promise<string> {
  if (type === "body") return `https://mc-heads.net/body/${uuid}/512`;
  if (type === "head") return `https://mc-heads.net/head/${uuid}/256`;
  return `https://mc-heads.net/avatar/${uuid}/256`;
}

export async function getPlayerHead(username: string): Promise<string | null> {
  const uuid = await getMinecraftUUID(username);
  if (!uuid) return null;
  return getSkinUrl(uuid, "head");
}
