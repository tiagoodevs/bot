import type { Interaction } from "discord.js";
import staff from "../../staff.json"

export function isStaff(userId: string) {
    return !!staff.includes(userId)
}

export function canRun(interaction: Interaction, staffOnly = false): boolean {
    return !staffOnly || isStaff(interaction.user.id)
}
