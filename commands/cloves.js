import Command from "./bases/command.js";
import { get_cloves } from "../interactions.js";

class Cloves extends Command {
    async exec(args) {
        const { interaction, name } = args;

        await interaction.deferReply();
        const cloves = await get_cloves(interaction.user.id);

        await interaction.editReply({
            embeds: [{
                title: `${name} has ${cloves} cloves! ${this.emote_map.heart_1}`,
                color: this.colors["GARLIC"]
            }]
        });

        return {success: true};
    }
}

export {
    Cloves
};