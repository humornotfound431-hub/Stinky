import { configDotenv } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder, MessageFlags } from 'discord.js';
import mongoose from 'mongoose';

import { get_jokes, place_bet, get_cloves, donate_cloves, play_slots, COLORS } from './interactions.js';
import TicTacToe from './games/tictactoe.js';

configDotenv();

// Test server
// 1488407905580351598 :: Text channels

// Garlic server
// 1487876883373883432 :: Community
// 1498159882359279778 :: Clove Casino
// 1488042622470852709 :: Mod/Admin
const channels = ["1498159882359279778:gaming", "1498159882359279778:garlic-gambling", "1488042622470852709:bot-setup", "1488407905580351598:general"];
const cmd_channel_perms = new Map([
    ["ping", new Set([channels[0], channels[1], channels[2], channels[3]])],
    ["random_joke", new Set(channels)],
    ["bet", new Set([channels[1], channels[2], channels[3]])],
    ["slots", new Set([channels[1], channels[2], channels[3]])],
    ["cloves", new Set([channels[0], channels[1], channels[2], channels[3]])],
    ["donate", new Set([channels[0], channels[1], channels[2], channels[3]])],
    ["help", new Set(channels)],
    ["tic-tac-toe", new Set([channels[0], channels[2], channels[3]])]
]);

mongoose.connect(process.env.MONGODB_URI)
.then(data => console.log("Database connected"))
.catch(err => {
    console.error(err);
    process.exit(1);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: ['MESSAGE', 'CHANNEL']
});

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

let currentGame;
function renderBoard(board) {
    return board.map(row =>
        row.map(cell => cell === "" ? "⬜" : (cell === "x" ? "❌" : "⭕")).join(" ")
    ).join("\n");
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        const name = interaction.member?.displayName || interaction.user.globalName || interaction.user.username;

        if (!cmd_channel_perms.get(interaction.commandName).has(`${interaction.channel.parent.id}:${interaction.channel.name}`)) {
            const err = new Error("This command cannot be used here");
            err.custom_msg = true;
            throw err;
        }

        if (interaction.commandName === "ping") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await interaction.editReply({ content: "pong" });
        }
        else if (interaction.commandName === "random_joke") {
            await interaction.deferReply();
            const joke_obj = await get_jokes(1);
            const content = `${joke_obj.setup}\n\n${joke_obj.punchline}`;
            await interaction.editReply({ content });
        }
        else if (interaction.commandName === "bet") {
            await interaction.deferReply();
            const channel = await client.channels.fetch(interaction.channelId);
            const amount = interaction.options.getString("amount").toLowerCase();
            const choice = interaction.options.getString("choice").toLowerCase();

            const {success, message} = await place_bet(amount, choice, channel, name, interaction.user.id);
            const embed_bet = new EmbedBuilder()
                .setTitle(message)
                .setColor((success) ? COLORS.GARLIC : COLORS.RED)

            await interaction.editReply({ embeds: [embed_bet] });
        }
        else if (interaction.commandName === "slots") {
            await interaction.deferReply();
            const amount = interaction.options.getString("amount").toLowerCase();

            const {success, message, changed, results} = await play_slots(interaction, amount);

            const embed_slots = new EmbedBuilder()
                .setTitle(message)
                .setDescription(success ? `\n${results[0]} │ ${results[1]} │ ${results[2]}` : "")
                .setColor((success) ? COLORS.GARLIC : COLORS.RED)
                .addFields(
                    { name: "\u200B", value: " " },
                    { name: `${name}: (Bet ${amount})`, value: (success) ? String(changed) : "+0" }
                );
            
            await interaction.editReply({ embeds: [embed_slots] });
        }
        else if (interaction.commandName === "cloves") {
            await interaction.deferReply();
            const cloves = await get_cloves(interaction.user.id);

            const embed_cloves = new EmbedBuilder()
                .setTitle(`${name} has ${cloves} cloves! <:heart_1:1493445209537777684>`)
                .setColor(COLORS.GARLIC);

            await interaction.editReply({ embeds: [embed_cloves] });
        }
        else if (interaction.commandName === "donate") {
            await interaction.deferReply();
            let donate_amount = interaction.options.getString("amount").toLowerCase();

            const target_member = interaction.options.getMember("user");
            const target_name = target_member?.displayName || target_member?.user.globalName || target_member?.user.username;

            const {success, message} = await donate_cloves(interaction.user.id, target_member.id, name, target_name, donate_amount);

            const embed_donate = new EmbedBuilder()
                .setTitle(message)
                .setColor((success) ? COLORS.GARLIC : COLORS.RED)

            await interaction.editReply({ embeds: [embed_donate] });
        }
        else if (interaction.commandName === "tic-tac-toe") {
            await interaction.reply("Nope");
            return;

            const sub = interaction.options.getSubcommand();
            if (sub === "start") {
                const opponent = interaction.options.getUser("opponent");

                if (currentGame) {
                    return interaction.reply("A game is already running.");
                }

                currentGame = new TicTacToe(interaction.user.id, opponent.id);
                const data = await currentGame.start();

                const boardStr = renderBoard(currentGame.board);

                await interaction.reply({
                    embeds: [{
                        title: "Tic Tac Toe",
                        description:
                            `${interaction.user} vs ${opponent}\n\n` +
                            `**${interaction.user}**: ${currentGame.id_to_symbol[interaction.user.id]}\n` +
                            `**${opponent}**: ${currentGame.id_to_symbol[opponent.id]}\n\n` +
                            `**Turn:** <@${currentGame.turn}>\n\n` +
                            boardStr
                    }]
                });
            }

            else if (sub === "move") {
                if (!currentGame) {
                    return interaction.reply("No active game.");
                }

                const position = interaction.options.getInteger("position");

                const result = currentGame.place_mark(interaction.user.id, position);

                if (!result.success) {
                    return interaction.reply(result.message);
                }

                const boardStr = renderBoard(result.board);

                let desc = boardStr;

                if (result.winner) {
                    desc += `\n\n🏆 Winner: <@${result.winner}>`;
                    currentGame = null;
                } else if (result.draw) {
                    desc += `\n\n🤝 Draw`;
                    currentGame = null;
                } else {
                    desc += `\n\n**Turn:** <@${currentGame.turn}>`;
                }

                await interaction.reply({
                    embeds: [{
                        title: "Tic Tac Toe",
                        description: desc
                    }]
                });
            }

            else if (sub === "end") {
                if (!currentGame) {
                    return interaction.reply("No active game.");
                }

                currentGame = null;

                await interaction.reply({
                    embeds: [{
                        title: "Game Ended",
                        description: `<@${interaction.user.id}> ended the game.`
                    }]
                });
            }
        }
        else if (interaction.commandName === "help") {
            const embed = new EmbedBuilder()
                .setTitle("Bot Commands")
                .setColor(COLORS.GARLIC)
                .addFields(
                    { name: "`/ping`", value: "Check if bot is alive", inline: false },
                    { name: "`/random_joke`", value: "Gives a random joke...don't get cringed out", inline: false },
                    { name: "`/cloves`", value: "Check your clove balance", inline: false },
                    { name: "`/bet <amount> <choice>`", value: "Play roulette [Bet on colors (red/black/green), numbers (0 - 36) or odd/even]", inline: false },
                    { name: "`/donate <user> <amount>`", value: "Send your cloves to someone else", inline: false },
                    { name: "`/slots <amount>`", value: "Play slots", inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        }
    }
    catch (err) {
        console.error(`[ERROR] ${interaction.user.username} used /${interaction.commandName}:`, err.message);
        let msg = "Ah dang, some stoopid error happened <:crying:1493445299815845958>";

        if (err.custom_msg) msg = err.message;

        const err_embed = new EmbedBuilder()
            .setTitle(msg)
            .setColor(COLORS.RED);

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [err_embed] });
            } else {
                await interaction.reply({ embeds: [err_embed], flags: MessageFlags.Ephemeral });
            }
        } catch { /* if error reply itself fails, give up */ }
    }
    finally {
        const d = new Date();
        const time = d.toLocaleTimeString("en-IN", {hour12: false});
        const date = d.toLocaleDateString('en-GB').slice(0,5);

        console.log(`>> ${interaction.user.username}:${interaction.user.id} used ${interaction.commandName} :: ${time}|${date}`);
    }
});

client.login(process.env.TOKEN);
