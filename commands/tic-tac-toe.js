import { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import TicTacToe from "../games/tictactoe.js";
import Game from "./bases/game.js";

let currentGame = null;
let tttInstance;

class Tic_Tac_Toe extends Game {
    async exec(args) {
        this.interaction = args.interaction;
        const client = args.client;
        tttInstance = this;

        const sub = this.interaction.options.getSubcommand();
        this.channel = await client.channels.fetch(this.interaction.channelId);

        if (sub === "start") {
            await this.start();
        }
        else if (sub === "join") {
            await this.join();
        }
        else if (sub === "end") {
            await this.end();
        }

        return {success: true};
    }

    getCurrentGame() {
        return currentGame;
    }

    setCurrentGame(instance) {
        currentGame = instance;
    }

    async checkCurrentGame() {
        if (currentGame) return true;

        await this.interaction.reply({
            embeds: [{
                title: `No game running right now ${this.emote_map.sweat_1}`,
                color: this.colors["RED"]
            }],

            flags: MessageFlags.Ephemeral
        });

        return false;
    };

    async start() {
        const amount = this.interaction.options.getInteger("amount") || null;

        if (currentGame) {
            return await this.interaction.reply({
                embeds: [{
                    title: `A game is already running ${this.emote_map.peek}`,
                    color: this.colors["RED"]
                }],

                flags: MessageFlags.Ephemeral
            });
        }

        this.setCurrentGame(new TicTacToe(this.interaction.user.id, amount));
        this.startTimeout(300);

        currentGame.msg = await this.channel.send({
            embeds: [{
                title: "Tic Tac Toe Challenge",
                description:
                    `${this.interaction.user} started a Tic Tac Toe game ${this.emote_map.peek}\n\n` +
                    `💰 **Wager:** ${currentGame.amount} cloves\n\n` +
                    `Use \`/tic-tac-toe join\` to join the game!`,
                color: this.colors["GARLIC"],
            }]
        });

        await this.interaction.reply({
            embeds: [{
                title: "Started the game",
                color: this.colors["GARLIC"]
            }],

            flags: MessageFlags.Ephemeral
        });
    }

    async join() {
        if (!(await this.checkCurrentGame(this.interaction))) return;

        currentGame.player2_id = this.interaction.user.id;
        await currentGame.start();

        this.resetTimeout(1800); //1800 seconds, 30 min

        let buttons = [];
        for (let row_index = 0; row_index < currentGame.board.length; row_index++) {
            buttons.push(new ActionRowBuilder().addComponents(...currentGame.board[row_index].map((cell, cell_index) => {
                return new ButtonBuilder()
                    .setCustomId(`${this.interaction.commandName}:${(row_index * 3) + cell_index + 1}`)
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
                color: this.colors["GARLIC"],
            }],

            components: buttons
        });

        await this.interaction.reply({
            embeds: [{
                title: "Joined the game",
                color: this.colors["GARLIC"]
            }],

            flags: MessageFlags.Ephemeral
        });
    }

    async end() {
        if (!(await this.checkCurrentGame(this.interaction))) return;

        currentGame = null;
        clearTimeout(this.timeout);
        
        await this.interaction.reply({
            embeds: [{
                title: `${this.interaction.user} ended the game ${this.emote_map.bigbrain}`,
                color: this.colors["RED"]
            }]
        });
    }

    async make_move(interaction, buttonId) {
        this.interaction = interaction;

        if (!(await this.checkCurrentGame(this.interaction))) return {success: false, message: `No game running right now ${this.emote_map.sweat_1}`};
        
        const {success, message, winner, draw, board} = await currentGame.place_mark(this.interaction.user.id, Number(buttonId));

        if (!success) {
            await this.interaction.reply({
                embeds: [{
                    title: message,
                    color: this.colors["RED"]
                }],

                flags: MessageFlags.Ephemeral
            });

            return {success, message};
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
            clearTimeout(this.timeout);
        }
        else if (draw) {
            desc += `\n\n🤝 Draw`;
            currentGame = null;
            clearTimeout(this.timeout);
        }
        else {
            desc = `<@${currentGame.player1_id}>: ${currentGame.id_to_symbol[currentGame.player1_id]}\n` +
                    `<@${currentGame.player2_id}>: ${currentGame.id_to_symbol[currentGame.player2_id]}\n\n` +
                    `**Turn:** <@${currentGame.turn}>\n\n`;

            this.resetTimeout(1800); //1800 seconds, 30 min
        }

        await msg.edit({
            embeds: [{
                title: "Tic Tac Toe",
                description: desc,
                color: this.colors["GARLIC"],
            }],

            components: buttons
        });
        
        const replyMsg = "You made a move yay";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return {success, message: replyMsg};
    }
}

export {
    Tic_Tac_Toe,
    tttInstance
};