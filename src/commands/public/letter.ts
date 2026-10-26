import {
  AttachmentBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { join } from "path";
import { errorNotice, notice, respond, respondEdit } from "../../functions/reply";
import { Command } from "../../types/command";

const FONTS_DIR = join(__dirname, "..", "..", "fonts");

try {
  GlobalFonts.registerFromPath(join(FONTS_DIR, "Butterfly_Kids", "ButterflyKids-Regular.ttf"), "Butterfly Kids");
  GlobalFonts.registerFromPath(join(FONTS_DIR, "VT323", "VT323-Regular.ttf"), "VT323");
} catch {}

export default new Command({
  info: new SlashCommandBuilder()
    .setName("letter")
    .setDescription("Create a cute/custom letter style image!")
    .addStringOption((option) =>
      option.setName("text").setDescription("Text to put on the letter").setRequired(true).setMaxLength(200),
    )
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("Letter style")
        .addChoices(
          { name: "Cute", value: "cute" },
          { name: "Retro", value: "retro" },
          { name: "Fancy", value: "fancy" },
          { name: "Bubble", value: "bubble" },
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const text = interaction.options.getString("text", true);
    const style = interaction.options.getString("style") || "cute";

    try {
      await interaction.deferReply();
    } catch (err) {
      console.log("[Command: letter] Failed to defer reply", err);
      await respond(interaction, {
        components: [errorNotice("Could not start", "The interaction expired.")],
        flags: ["Ephemeral"],
      });
      return;
    }

    try {
      const W = 600;
      const H = 400;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      if (style === "cute") {
        ctx.fillStyle = "#fff0f6";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffb6c1";
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * W, Math.random() * H, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#d6336c";
        ctx.font = "48px 'Butterfly Kids', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, W / 2, H / 2);
      } else if (style === "retro") {
        ctx.fillStyle = "#2b2b2b";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, W - 40, H - 40);
        ctx.fillStyle = "#00ff00";
        ctx.font = "32px VT323, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // word wrap
        const words = text.split(" ");
        let line = "";
        let y = H / 2 - 20;
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > W - 80 && line) {
            ctx.fillText(line, W / 2, y);
            line = word + " ";
            y += 36;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, W / 2, y);
      } else if (style === "fancy") {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#f7e7ce");
        grad.addColorStop(1, "#e6d3a3");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#8b7355";
        ctx.lineWidth = 4;
        ctx.strokeRect(15, 15, W - 30, H - 30);
        ctx.fillStyle = "#4a3728";
        ctx.font = "40px 'Plus Jakarta Sans', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const words = text.split(" ");
        let line = "";
        let y = H / 2 - 30;
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > W - 100 && line) {
            ctx.fillText(line, W / 2, y);
            line = word + " ";
            y += 48;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, W / 2, y);
      } else if (style === "bubble") {
        ctx.fillStyle = "#a5f3fc";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(50, 80, W - 100, H - 160, 40) : (() => {
          ctx.moveTo(90, 80);
          ctx.arcTo(W - 50, 80, W - 50, 120, 40);
          ctx.arcTo(W - 50, H - 80, W - 90, H - 80, 40);
          ctx.arcTo(50, H - 80, 50, H - 120, 40);
          ctx.arcTo(50, 80, 90, 80, 40);
          ctx.closePath();
        })();
        ctx.fill();
        ctx.fillStyle = "#0891b2";
        ctx.font = "38px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const words = text.split(" ");
        let line = "";
        let y = H / 2 - 25;
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > W - 150 && line) {
            ctx.fillText(line, W / 2, y);
            line = word + " ";
            y += 46;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, W / 2, y);
      }

      const buf = canvas.toBuffer("image/png");
      const attachment = new AttachmentBuilder(buf, { name: "letter.png" });
      await interaction.editReply({ files: [attachment] });
    } catch (err) {
      console.log("[Command: letter] Error", err);
      await respondEdit(interaction, {
        components: [errorNotice("Failed", "Something went wrong creating your letter.")],
      });
    }
  },
});
