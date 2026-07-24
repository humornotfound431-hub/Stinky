import Command from "./bases/command.js";
import { place_bet } from "../interactions.js";
import { MessageFlags } from "discord.js";

class Bet extends Command {
    async exec(args) {
        const { interaction, name, client } = args;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = await client.channels.fetch(interaction.channelId);
        const amount = interaction.options.getString("amount").toLowerCase();
        const choice = interaction.options.getString("choice").toLowerCase();

        const {success, message} = await place_bet(amount, choice, channel, name, interaction.user.id, interaction.botName);

        await interaction.editReply({ embeds: [{
            title: message,
            color: (success) ? this.colors["GARLIC"] : this.colors["RED"]
        }] });

        let reply;
        if (!success) {
            reply = {success, message, customMsg: message};
        }
        else {
            reply = {success, message};
        }

        return reply;
    }
}

export {
    Bet
};