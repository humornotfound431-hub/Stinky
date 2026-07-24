import Command from "./bases/command.js";
import { get_currency } from "../interactions.js";

class Currency extends Command {
    async exec(args) {
        const { interaction, name } = args;
        const botName = interaction.botName;

        const currencyName = botName === "garlic" ? "cloves" : "batteries";

        await interaction.deferReply();
        const currency = await get_currency(interaction.user.id);

        const emote = botName === "garlic" ? this.emote_map.heart_1 : this.emote_map.HappyRheo;
        await interaction.editReply({
            embeds: [{
                title: `${name} has ${currency} ${currencyName}! ${emote}`,
                color: this.colors["GARLIC"]
            }]
        });

        return {success: true};
    }
}

export {
    Currency
};