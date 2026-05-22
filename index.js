import { configDotenv } from 'dotenv';

import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle, 
    Message
} from 'discord.js';

import mongoose from 'mongoose';

import { get_jokes, place_bet, get_cloves, donate_cloves, play_slots, check_daily } from './interactions.js';
import { get_sorted_streaks } from "./user_utils.js";
import TicTacToe from './games/tictactoe.js';
import config from './config.json' with { type: 'json' };

configDotenv();
const { channels, emote_map, colors } = config;
// Test server
// 1488407905580351598 :: Text channels

// Garlic server
// 1487876883373883432 :: Community
// 1498159882359279778 :: Clove Casino
// 1488042622470852709 :: Mod/Admin
const cmd_channel_perms = new Map([
    ["ping", null],
    ["random_joke", null],
    ["daily", new Set([channels['daily-cloves'], channels['test-server-general']])],    
    ["bet", new Set([channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["slots", new Set([channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["cloves", new Set([channels['garlic-gaming'], channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["donate", new Set([channels['garlic-gaming'], channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["help", null],
    ["tic-tac-toe", new Set([channels['garlic-gaming'], channels['bot-setup'], channels['test-server-general']])]
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
        row.map(cell => cell === "" ? "⬛" : (cell === "x" ? "❌" : "⭕")).join(" ")
    ).join("\n");
}

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            const [type, id] = interaction.customId.split(":");

            if (type === "tic-tac-toe") {
                if (!currentGame) {
                    return await interaction.reply({
                        embeds: [{
                            title: `No game running right now ${emote_map.sweat_1}`,
                            color: colors["RED"]
                        }],

                        flags: MessageFlags.Ephemeral
                    });
                }
                
                const {success, message, winner, draw, board} = await currentGame.place_mark(interaction.user.id, Number(id));

                if (!success) {
                    return await interaction.reply({
                        embeds: [{
                            title: message,
                            color: colors["RED"]
                        }],

                        flags: MessageFlags.Ephemeral
                    });
                }

                let buttons = [];
                for (let row_index = 0; row_index < currentGame.board.length; row_index++) {
                    buttons.push(new ActionRowBuilder().addComponents(...currentGame.board[row_index].map((cell, cell_index) => {
                        return new ButtonBuilder()
                            .setCustomId(`tic-tac-toe:${(row_index * 3) + cell_index + 1}`)
                            .setLabel(currentGame.board[row_index][cell_index] || "\u200b")
                            .setStyle(ButtonStyle.Secondary)
                    })));
                }
                
                let desc = "";
                const msg = currentGame.msg;
                if (winner) {
                    desc += `\n\n🏆 Winner: <@${winner}>`;
                    currentGame = null;
                } else if (draw) {
                    desc += `\n\n🤝 Draw`;
                    currentGame = null;
                }
                else {
                    desc = `<@${currentGame.player1_id}>: ${currentGame.id_to_symbol[currentGame.player1_id]}\n` +
                            `<@${currentGame.player2_id}>: ${currentGame.id_to_symbol[currentGame.player2_id]}\n\n` +
                            `**Turn:** <@${currentGame.turn}>\n\n`;
                }

                await msg.edit({
                    embeds: [{
                        title: "Tic Tac Toe",
                        description: desc,
                        color: colors["GARLIC"],
                    }],

                    components: buttons
                });
                
                return await interaction.reply({
                    embeds: [{
                        title: "You made a move yay",
                        color: colors["GARLIC"]
                    }],
                    flags: MessageFlags.Ephemeral
                });
            }
            else if (type === "daily" && id === "claim") {
                const {success, message, streak, amount} = await check_daily(interaction.user.id);

                if (success) {
                    const leaderboard = await get_sorted_streaks();

                    let desc = "Claim your daily cloves using the button below\n\n**Streak Leaderboard:**\n\n";

                    leaderboard.forEach((user, index) => {
                        desc += `${index + 1}. <@${user.discord_id}>: ${user.streak_daily}\n`;
                    });

                    await interaction.message.edit({
                        embeds: [{
                            title: `${emote_map.blob} Daily Cloves ${emote_map.blob}`,
                            description: desc,
                            color: colors["GARLIC"]
                        }],

                        components: interaction.message.components
                    });
                }

                return await interaction.reply({flags: MessageFlags.Ephemeral, embeds: [{
                    title: message,
                    description: success ? `+${amount} (${streak} day streak)` : "",
                    color: success ? colors["GARLIC"] : colors["RED"]
                }]});
            }
        }

        const name = interaction.member?.displayName || interaction.user.globalName || interaction.user.username;
        const cmd = interaction.commandName;

        if (cmd_channel_perms.get(cmd) && !cmd_channel_perms.get(cmd).has(`${interaction.channel.id}`)) {
            const err = new Error("This command cannot be used here");
            err.custom_msg = true;
            throw err;
        }

        if (cmd === "ping") {
            await interaction.reply({ content: "pong", flags: MessageFlags.Ephemeral });
        }
        else if (cmd === "daily") {
            await interaction.deferReply({});

            const leaderboard = await get_sorted_streaks();
            let desc = "Claim your daily cloves using the button below\n\n**Streak Leaderboard:**\n\n";

            leaderboard.forEach((user, index) => {
                desc += `${index + 1}. <@${user.discord_id}>: ${user.streak_daily}\n`;
            });

            await interaction.editReply({
                embeds: [{
                    title: `${emote_map.blob} Daily Cloves ${emote_map.blob}`,
                    description: desc,
                    color: colors["GARLIC"]
                }],

                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("daily:claim")
                            .setEmoji("🧄")
                            .setStyle(ButtonStyle.Success)
                    )
                ]
            });
        }
        else if (cmd === "random_joke") {
            await interaction.deferReply();
            const joke_obj = await get_jokes(1);
            const content = `${joke_obj.setup}\n\n${joke_obj.punchline}`;
            await interaction.editReply({ content });
        }
        else if (cmd === "bet") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            const channel = await client.channels.fetch(interaction.channelId);
            const amount = interaction.options.getString("amount").toLowerCase();
            const choice = interaction.options.getString("choice").toLowerCase();

            const {success, message} = await place_bet(amount, choice, channel, name, interaction.user.id);
            const embed_bet = new EmbedBuilder()
                .setTitle(message)
                .setColor((success) ? colors["GARLIC"] : colors["RED"])

            await interaction.editReply({ embeds: [embed_bet] });
        }
        else if (cmd === "slots") {
            await interaction.deferReply();
            const amount = interaction.options.getString("amount").toLowerCase();

            const {success, message, changed, results} = await play_slots(interaction, amount);

            if (!success) {
                return await interaction.editReply({ embeds: [{
                    title: message,
                    color: colors["RED"]
                }]});
            }

            const embed_slots = new EmbedBuilder()
                .setTitle(message)
                .setDescription(success ? `\n${results[0]} │ ${results[1]} │ ${results[2]}` : "")
                .setColor((success) ? colors["GARLIC"] : colors["RED"])
                .addFields(
                    { name: "\u200B", value: " " },
                    { name: `${name}: (Bet ${amount})`, value: (success) ? String(changed) : "+0" }
                );
            
            await interaction.editReply({ embeds: [embed_slots] });
        }
        else if (cmd === "cloves") {
            await interaction.deferReply();
            const cloves = await get_cloves(interaction.user.id);

            const embed_cloves = new EmbedBuilder()
                .setTitle(`${name} has ${cloves} cloves! ${emote_map.heart_1}`)
                .setColor(colors["GARLIC"]);

            await interaction.editReply({ embeds: [embed_cloves] });
        }
        else if (cmd === "donate") {
            await interaction.deferReply();
            let donate_amount = interaction.options.getString("amount").toLowerCase();

            const target_member = interaction.options.getMember("user");
            const target_name = target_member?.displayName || target_member?.user.globalName || target_member?.user.username;

            const {success, message} = await donate_cloves(interaction.user.id, target_member.id, name, target_name, donate_amount);

            const embed_donate = new EmbedBuilder()
                .setTitle(message)
                .setColor((success) ? colors["GARLIC"] : colors["RED"])

            await interaction.editReply({ embeds: [embed_donate] });
        }
        else if (cmd === "tic-tac-toe") {
            const sub = interaction.options.getSubcommand();
            const channel = await client.channels.fetch(interaction.channelId);

            if (sub === "start") {
                const amount = interaction.options.getInteger("amount") || null;

                if (currentGame) {
                    return await interaction.reply({
                        embeds: [{
                            title: `A game is already running ${emote_map.peek}`,
                            color: colors["RED"]
                        }],

                        flags: MessageFlags.Ephemeral
                    });
                }

                currentGame = new TicTacToe(interaction.user.id, amount);

                currentGame.msg = await channel.send({
                    embeds: [{
                        title: "Tic Tac Toe Challenge",
                        description:
                            `${interaction.user} started a Tic Tac Toe game ${emote_map.peek}\n\n` +
                            `💰 **Wager:** ${currentGame.amount} cloves\n\n` +
                            `Use \`/tic-tac-toe join\` to join the game!`,
                        color: colors["GARLIC"],
                    }]
                });

                await interaction.reply({
                    embeds: [{
                        title: "Started the game",
                        color: colors["GARLIC"]
                    }],

                    flags: MessageFlags.Ephemeral
                });
            }

            else if (sub === "join") {
                if (!currentGame) {
                    return await interaction.reply({
                        embeds: [{
                            title: `No game running right now ${emote_map.sweat_1}`,
                            color: colors["RED"]
                        }],

                        flags: MessageFlags.Ephemeral
                    });
                }

                currentGame.player2_id = interaction.user.id;
                await currentGame.start();

                let buttons = [];
                for (let row_index = 0; row_index < currentGame.board.length; row_index++) {
                    buttons.push(new ActionRowBuilder().addComponents(...currentGame.board[row_index].map((cell, cell_index) => {
                        return new ButtonBuilder()
                            .setCustomId(`${interaction.commandName}:${(row_index * 3) + cell_index + 1}`)
                            .setLabel(currentGame.board[row_index][cell_index] || "\u200b")
                            .setStyle(ButtonStyle.Secondary)
                    })));
                }

                await currentGame.msg.edit({
                    embeds: [{
                        title: "Tic Tac Toe",
                        description:
                            `<@${currentGame.player1_id}>: ${currentGame.id_to_symbol[currentGame.player1_id]}\n` +
                            `<@${currentGame.player2_id}>: ${currentGame.id_to_symbol[currentGame.player2_id]}\n\n` +
                            `**Turn:** <@${currentGame.turn}>\n\n`,
                        color: colors["GARLIC"],
                    }],

                    components: buttons
                });

                await interaction.reply({
                    embeds: [{
                        title: "Joined the game",
                        color: colors["GARLIC"]
                    }],

                    flags: MessageFlags.Ephemeral
                });
            }

            else if (sub === "end") {
                if (!currentGame) {
                    return await interaction.reply({
                        embeds: [{
                            title: `No game running right now ${emote_map.sweat_1}`,
                            color: colors["RED"]
                        }],

                        flags: MessageFlags.Ephemeral
                    });
                }

                currentGame = null;

                await interaction.reply({
                    embeds: [{
                        title: `${interaction.user} ended the game ${emote_map.bigbrain}`,
                        color: colors["RED"]
                    }]
                });
            }
        }
        else if (cmd === "help") {
            const embed = new EmbedBuilder()
                .setTitle("Bot Commands")
                .setColor(colors["GARLIC"])
                .addFields(
                    { name: "⚙️ General", value: "\`/ping\` - Check if bot is alive\n\`/random_joke\` - Gives a random joke...don't get cringed out", inline: false },
                    { name: "🎰 Gambling", value: "\`/cloves\` - Check your clove balance\n\`/daily\` - Claim your daily cloves\n\`/bet <amount> <choice>\` - Play roulette\n\`/slots <amount>\` - Play slots\n\`/donate <user> <amount>\` - Send your cloves to someone else", inline: false },
                    { name: "🎮 Games", value: "\`/tic-tac-toe\` - Play tic tac toe against someone", inline: false }
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
            .setColor(colors["RED"]);

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

        if (interaction.isButton()) console.log(`>> ${interaction.user.username}:${interaction.user.id} clicked ${interaction.customId} :: ${time}|${date}`); 
        else console.log(`>> ${interaction.user.username}:${interaction.user.id} used ${interaction.commandName} :: ${time}|${date}`);
    }
});

client.login(process.env.TOKEN);
