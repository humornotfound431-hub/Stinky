import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { configDotenv } from 'dotenv';

configDotenv();
const batteryCommands = [
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
                .setDescription("Amount of batteries to bet (Use 'all' to bet everything)")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("choice")
                .setDescription("Your bet (red, black, green, odd, even, or 0-36)")
                .setRequired(true)
        ),

        new SlashCommandBuilder()
            .setName("batteries")
            .setDescription("Check how many batteries you have"),
        
        new SlashCommandBuilder()
            .setName("donate")
            .setDescription("Donate batteries to the people in need :')")
            .addUserOption(option => 
                option
                    .setName("user")
                    .setDescription("User you are donating to")
                    .setRequired(true)
            )
            .addStringOption(option => 
                option
                    .setName("amount")
                    .setDescription("Amount of batteries to donate [ use 'all' to donate everything ;) ]")
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName("tic-tac-toe")
            .setDescription("Play Tic Tac Toe")

            .addSubcommand(sub =>
                sub
                    .setName("start")
                    .setDescription("Start a new game")
                    .addIntegerOption(option =>
                        option
                            .setName("amount")
                            .setDescription("Amount of cloves to bet")
                            .setMinValue(1)
                    )
            )

            .addSubcommand(sub => 
                sub
                    .setName("join")
                    .setDescription("Join a game")
            )

            .addSubcommand(sub =>
                sub
                    .setName("end")
                    .setDescription("End the current game")
            ),
        new SlashCommandBuilder()
            .setName("chess")
            .setDescription("Play chess")

].map(cmd => cmd.toJSON());

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong'),
    
    new SlashCommandBuilder()
        .setName('random_joke')
        .setDescription('Gives a random joke'),
    
    new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Sends the daily cloves message"),
    
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
                .setDescription("Amount of cloves to bet. Minimum => 100 (Use 'all' to bet everything)")
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
                .addIntegerOption(option =>
                    option
                        .setName("amount")
                        .setDescription("Amount of cloves to bet")
                        .setMinValue(1)
                )
        )

        .addSubcommand(sub => 
            sub
                .setName("join")
                .setDescription("Join a game")
        )

        .addSubcommand(sub =>
            sub
                .setName("end")
                .setDescription("End the current game")
        ),
    new SlashCommandBuilder()
        .setName("chess")
        .setDescription("Play chess")

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.GARLIC_TOKEN);
const battery_rest = new REST({ version: '10' }).setToken(process.env.BATTERY_TOKEN);

(async () => {
    try {
        console.log('Registering commands...');

        await rest.put(
            Routes.applicationCommands(process.env.GARLIC_APP_ID),
            { body: commands }
        );

        await battery_rest.put(
            Routes.applicationCommands(process.env.BATTERY_APP_ID),
            { body: batteryCommands }
        );

        console.log('Commands registered!');
    } catch (err) {
        console.error(err);
    }
})();