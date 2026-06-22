import { configDotenv } from 'dotenv';

import {
    Client,
    GatewayIntentBits,
    MessageFlags
} from 'discord.js';

import { Ping } from "./commands/ping.js";
import { Daily } from './commands/daily.js';
import { Joke } from './commands/joke.js';
import { Bet } from './commands/bet.js';
import { Slots } from './commands/slots.js';
import { Cloves } from "./commands/cloves.js";
import { Donate } from './commands/donate.js';
import { Tic_Tac_Toe, tttInstance } from './commands/tic-tac-toe.js';
import { Chess, chessInstance } from './commands/chess.js';
import { Help } from './commands/help.js';

import mongoose from 'mongoose';
import config from './config.json' with { type: 'json' };
import commandChannelPerms from './cmdPerms.js';

configDotenv();
const { emote_map, colors } = config;

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

client.on('interactionCreate', async (interaction) => {
    try {
        const name = interaction.member?.displayName || interaction.user.globalName || interaction.user.username;
        let interactionReply;

        if (interaction.isButton()) {
            const [type, id] = interaction.customId.split(":");

            switch (type) {
                case "tic-tac-toe":
                    interactionReply = await tttInstance.make_move(interaction, id);
                    break;
                case "daily":
                    if (id === "claim") {
                        interactionReply = await Daily.claim(interaction, emote_map, colors);
                    }
                    break;
                case "chess":
                    if (chessInstance) {
                        interactionReply = await chessInstance.handleAction(interaction, id);
                    }
                    break;
                case "chess_moves":
                    if (chessInstance) {
                        interactionReply = await chessInstance.handlePieceSelect(interaction, id);
                    }
                    break;
                case "chess_move":
                    if (chessInstance) {
                        interactionReply = await chessInstance.handleMove(interaction, id);
                    }
                    break;
                case "chess_draw":
                    if (chessInstance) {
                        interactionReply = await chessInstance.handleDraw(interaction, id);
                    }
                    break;
            }
        }
        else {
            const cmd = interaction.commandName;

            const permSet = commandChannelPerms.get(cmd);
            if (permSet && !permSet.has(`${interaction.channel.id}`)) {
                const err = new Error("Used command in unauthorized space");
                err.customMsg = `This command cannot be used here ${emote_map.ha}`;
                throw err;
            }

            switch (cmd) {
                case "ping":
                    interactionReply = await Ping.init({ interaction });
                    break;
                case "daily":
                    interactionReply = await Daily.init({ interaction });
                    break;
                case "random_joke":
                    interactionReply = await Joke.init({ interaction });
                    break;
                case "bet":
                    interactionReply = await Bet.init({ interaction, name, client });
                    break;
                case "slots":
                    interactionReply = await Slots.init({ interaction, name });
                    break;
                case "cloves":
                    interactionReply = await Cloves.init({ interaction, name });
                    break;
                case "donate":
                    interactionReply = await Donate.init({ interaction, name });
                    break;
                case "tic-tac-toe":
                    interactionReply = await Tic_Tac_Toe.init({ interaction, client });
                    break;
                case "chess":
                    interactionReply = await Chess.init({ interaction, client });
                    break;
                case "help":
                    interactionReply = await Help.init({ interaction });
                    break;
            }
        }

        if (!interactionReply.success) {
            const err = new Error(interactionReply.message);
            err.customMsg = interactionReply.customMsg;
            throw err;
        }

        const d = new Date();
        const time = d.toLocaleTimeString("en-IN", {hour12: false});
        const date = d.toLocaleDateString('en-GB').slice(0,5);

        if (interaction.isButton()) console.log(`>> ${interaction.user.username}:${interaction.user.id} clicked ${interaction.customId} :: ${time}|${date}`); 
        else console.log(`>> ${interaction.user.username}:${interaction.user.id} used ${interaction.commandName} :: ${time}|${date}`);
    }
    catch (err) {
        if (interaction.isButton()) console.log(`[ERROR] ${interaction.user.username}:${interaction.user.id} clicked ${interaction.customId}:`, err.message); 
        else console.error(`[ERROR] ${interaction.user.username} used /${interaction.commandName}:`, err.message);
        
        let msg = `Ah dang, some stoopid error happened ${emote_map.crying}`;
 
        if (err.customMsg) msg = err.customMsg;

        try {
            if (!(interaction.deferred || interaction.replied)) {
                await interaction.reply({
                    embeds: [{
                        title: msg,
                        color: colors["RED"]
                    }],

                    flags: MessageFlags.Ephemeral
                });
            }
        }
        catch { /* if error reply itself fails, give up */ }
    }
});

client.login(process.env.TOKEN);