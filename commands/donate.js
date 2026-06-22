import Command from "./command.js";
import { donate_cloves } from "../interactions.js";

class Donate extends Command {
    async exec(args) {
        const { interaction, name } = args;

        await interaction.deferReply();
        let donate_amount = interaction.options.getString("amount").toLowerCase();

        const target_member = interaction.options.getMember("user");
        const target_name = target_member?.displayName || target_member?.user.globalName || target_member?.user.username;

        const {success, message} = await donate_cloves(interaction.user.id, target_member.id, name, target_name, donate_amount);

        await interaction.editReply({
            embeds: [{
                title: message,
                color: (success) ? this.colors["GARLIC"] : this.colors["RED"]
            }]
        });

        return {success, message, customMsg: message};
    }
}

export {
    Donate
};