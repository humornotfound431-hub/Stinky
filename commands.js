import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { configDotenv } from 'dotenv';

configDotenv();

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong'),

    new SlashCommandBuilder()
        .setName('random_joke')
        .setDescription('Gives a random joke'),
    
    new SlashCommandBuilder()
        .setName("bet")
        .setDescription("Place a bet on roulette (color (red/black/green), number (0-36), odd/even)")
        
        .addStringOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of cloves to bet (Use 'all' to bet everything)")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("choice")
                .setDescription("Your bet (red, black, green, odd, even, or 0-36)")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play slots")
        .addStringOption(option => 
            option
                .setName("amount")
                .setDescription("Amount of cloves to bet (Use 'all' to bet everything)")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("cloves")
        .setDescription("Check how many cloves you have"),
    
    new SlashCommandBuilder()
        .setName("donate")
        .setDescription("Donate cloves to the people in need :')")
        .addUserOption(option => 
            option
                .setName("user")
                .setDescription("User you are donating to")
                .setRequired(true)
        )
        .addStringOption(option => 
            option
                .setName("amount")
                .setDescription("Amount of cloves to donate [ use 'all' to donate everything ;) ]")
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName("help")
        .setDescription("List all commands"),
    
    new SlashCommandBuilder()
        .setName("tic-tac-toe")
        .setDescription("Play Tic Tac Toe")

        .addSubcommand(sub =>
            sub
                .setName("start")
                .setDescription("Start a new game")
                .addUserOption(option =>
                    option
                        .setName("opponent")
                        .setDescription("User to play against")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("move")
                .setDescription("Make a move")
                .addIntegerOption(option =>
                    option
                        .setName("position")
                        .setDescription("Position (1-9)")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(9)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("end")
                .setDescription("End the current game")
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registering commands...');

        await rest.put(
            Routes.applicationCommands(process.env.APP_ID),
            { body: commands }
        );

        console.log('Commands registered!');
    } catch (err) {
        console.error(err);
    }
})();