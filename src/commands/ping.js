import Command from "./bases/command.js";
import { MessageFlags } from "discord.js";

class Ping extends Command {
    async exec(args) {
        const { interaction } = args;

        await interaction.reply({ content: "pong", flags: MessageFlags.Ephemeral });
    }
}

export {
    Ping
};