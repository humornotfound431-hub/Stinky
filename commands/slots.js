import Command from "./command.js";
import { play_slots } from "../interactions.js";

class Slots extends Command {
    async exec(args) {
        const { interaction, name } = args;

        await interaction.deferReply();
        const amount = interaction.options.getString("amount").toLowerCase();

        const {success, message, changed, results} = await play_slots(interaction, amount);

        if (!success) {
            await interaction.editReply({ embeds: [{
                title: message,
                color: this.colors["RED"]
            }]});

            return {success, message, customMsg: message};
        }
        
        await interaction.editReply({
            embeds: [{
                title: message,
                description: success ? `\n${results[0]} │ ${results[1]} │ ${results[2]}` : "",
                color: this.colors["GARLIC"],
                fields: [
                    { name: "\u200B", value: " " },
                    { name: `${name}: (Bet ${amount})`, value: (success) ? String(changed) : "+0" }
                ]
            }]
        });

        return {success, message};
    }
}

export {
    Slots
};