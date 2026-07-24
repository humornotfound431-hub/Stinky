import Command from "./bases/command.js";

const helpFields = {
    garlic: [
        {
            name: "⚙️ General",
            value: "`/ping` - Check if bot is alive\n`/random_joke` - Gives a random joke...don't get cringed out",
            inline: false
        },
        {
            name: "🎰 Gambling",
            value: "`/cloves` - Check your clove balance\n`/bet <amount> <choice>` - Play roulette\n`/slots <amount>` - Play slots\n`/donate <user> <amount>` - Send your cloves to someone else",
            inline: false
        },
        {
            name: "🎮 Games",
            value: "`/tic-tac-toe` - Play tic tac toe against someone\n`/chess` - Play Chess against someone",
            inline: false
        }
    ],

    battery: [
        {
            name: "⚙️ General",
            value: "`/ping` - Check if bot is alive\n`/random_joke` - Gives a random joke...don't get cringed out",
            inline: false
        },
        {
            name: "🎰 Gambling",
            value: "`/batteries` - Check your battery balance\n`/bet <amount> <choice>` - Play roulette\n`/donate <user> <amount>` - Send your batteries to someone else",
            inline: false
        },
        {
            name: "🎮 Games",
            value: "`/tic-tac-toe` - Play tic tac toe against someone\n`/chess` - Play Chess against someone",
            inline: false
        }
    ]
};

class Help extends Command {
    async exec(args) {
        const { interaction } = args;
        const botName = interaction.botName;

        const fields = botName === "garlic" ? helpFields.garlic : helpFields.battery;

        await interaction.reply({
            embeds: [{
                title: "Bot Commands",
                color: this.colors["GARLIC"],
                fields
            }]
        });        
    }
}

export {
    Help
};