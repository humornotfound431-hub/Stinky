import Command from "./command.js";
import { Chess_Game } from "../games/chess.js";
import { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from "discord.js";

let currentGame = null;
let chessInstance = null;

class Chess extends Command {
    async exec(args) {
        chessInstance = this;
        this.interaction = args.interaction;
        const client = args.client;

        this.channel = await client.channels.fetch(this.interaction.channelId);

        if (currentGame) {
            const msg = `A game is already running ${this.emote_map.peek}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });
            return { success: false, message: msg };
        }

        currentGame = new Chess_Game(this.interaction.user.id);

        currentGame.msg = await this.channel.send({
            embeds: [{
                title: "Chess Challenge",
                description:
                    `${this.interaction.user} started a Chess game ${this.emote_map.peek}\n\n` +
                    `Use the button below to join!!`,
                color: this.colors["GARLIC"],
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 1,
                    label: "Join",
                    custom_id: "chess:join"
                }]
            }]
        });

        const replyMsg = "Started the game";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return { success: true, message: replyMsg };
    }

    async handleAction(interaction, id) {
        this.interaction = interaction;
        
        if (id === "join") {
            return await this.join();
        }
        else if (id === "piece_select") {
            return await this.pieceSelect();
        }
        else if (id === "draw") {
            return await this.draw();
        }
        else if (id === "resign") {
            return await this.resign();
        }
    }

    async join() {
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });
            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        const sameUser = currentGame.player1_id === this.interaction.user.id;

        if (currentGame.player2 || sameUser) {
            const msg = sameUser ? "Cant play by yourself...yet" : "A Game already started";
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["GARLIC"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        currentGame.player2_id = this.interaction.user.id;
        await currentGame.start();

        let buttons = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("chess:piece_select")
                    .setLabel("Select Piece")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("chess:draw")
                    .setLabel("Draw")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("chess:resign")
                    .setLabel("Resign")
                    .setStyle(ButtonStyle.Danger)
            )
        ];

        const attachment = new AttachmentBuilder(
            currentGame.boardBuffer,
            { name: "board.png" }
        );

        await currentGame.msg.edit({
            embeds: [{
                title: "Chess",
                description:
                    `<@${currentGame.player1_id}>: ${currentGame.getColorName(currentGame.player1_id)}\n` +
                    `<@${currentGame.player2_id}>: ${currentGame.getColorName(currentGame.player2_id)}\n\n` +
                    `**Turn:** <@${currentGame.symbol_to_id[currentGame.game.turn()]}>\n\n`,
                color: this.colors["GARLIC"],
                image: {
                    url: "attachment://board.png"
                }
            }],
            files: [attachment],
            components: buttons
        });

        const replyMsg = "Joined the game";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return { success: true, message: replyMsg };
    }

    async pieceSelect() {
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('chess_moves:k').setLabel('♔ King').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('chess_moves:q').setLabel('♕ Queen').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('chess_moves:r').setLabel('♖ Rook').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('chess_moves:b').setLabel('♗ Bishop').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('chess_moves:n').setLabel('♘ Knight').setStyle(ButtonStyle.Secondary),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('chess_moves:p').setLabel('♙ Pawn').setStyle(ButtonStyle.Secondary),
        );

        const replyMsg = "Select a piece to see its moves";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral,
            components: [row1, row2]
        });

        return { success: true, message: replyMsg };
    }

    async draw() {
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        currentGame.draw_offer = this.interaction.user.id;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('chess_draw:accept')
                .setLabel('Accept Draw')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('chess_draw:refuse')
                .setLabel('Refuse Draw')
                .setStyle(ButtonStyle.Danger),
        );

        const attachment = new AttachmentBuilder(
            currentGame.boardBuffer,
            { name: "board.png" }
        );

        await currentGame.msg.edit({
            embeds: [{
                title: "Chess",
                description:
                    `<@${currentGame.player1_id}>: ${currentGame.getColorName(currentGame.player1_id)}\n` +
                    `<@${currentGame.player2_id}>: ${currentGame.getColorName(currentGame.player2_id)}\n\n` +
                    `**Turn:** <@${currentGame.symbol_to_id[currentGame.game.turn()]}>\n\n` +
                    `<@${this.interaction.user.id}> offering a draw...\n\n`,
                color: this.colors["GARLIC"],
                image: {
                    url: "attachment://board.png"
                }
            }],
            files: [attachment],
            components: [row]
        });

        const replyMsg = "Offered to Draw";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return { success: true, message: replyMsg };
    }

    async resign() {
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        const attachment = new AttachmentBuilder(
            currentGame.boardBuffer,
            { name: "board.png" }
        );

        const winnerId = currentGame.id_to_symbol[this.interaction.user.id] === "w" ? currentGame.symbol_to_id["b"] : currentGame.symbol_to_id["w"];

        await currentGame.msg.edit({
            embeds: [{
                title: `Game Over — Resignation`,
                description: `<@${this.interaction.user.id}> resigned. <@${winnerId}> wins!`,
                color: this.colors["GARLIC"],
                image: {
                    url: "attachment://board.png"
                }
            }],
            files: [attachment],
            components: []
        });

        currentGame.game.reset();
        currentGame = null;

        const replyMsg = "You resigned from the game";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return { success: true, message: replyMsg };
    }

    async handlePieceSelect(interaction, pieceId) {
        this.interaction = interaction;
        
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        const moves = currentGame.game.moves({ verbose: true }).filter(move => move.piece === pieceId);
        let row = new ActionRowBuilder();
        const buttons = [];

        const pieceEmojis = {
            p: "♙",
            n: "♘",
            b: "♗",
            r: "♖",
            q: "♕",
            k: "♔"
        };

        moves.forEach((move, index) => {
            const piece = pieceEmojis[move.piece];
            let label;

            if (move.captured) {
                label = `${piece} → ${pieceEmojis[move.captured]} ${move.to}`;
            } else {
                label = `${piece} → ${move.to}`;
            }

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`chess_move:${move.san}`)
                    .setLabel(label)
                    .setStyle(ButtonStyle.Secondary)
            );

            if (row.components.length === 5 || index === moves.length - 1) {
                buttons.push(row);
                row = new ActionRowBuilder();
            }
        });

        const replyMsg = "Moves for selected piece";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral,
            components: buttons
        });

        return { success: true, message: replyMsg };
    }

    async handleMove(interaction, moveId) {
        this.interaction = interaction;
        
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        const {success, message, isGameOver, gameOverInfo} = await currentGame.make_move(interaction.user.id, moveId);
        
        const attachment = new AttachmentBuilder(
            currentGame.boardBuffer,
            { name: "board.png" }
        );

        if (isGameOver) {
            await this.interaction.reply({
                embeds: [{
                    title: gameOverInfo.title,
                    description: gameOverInfo.message,
                    color: this.colors["GARLIC"],
                    image: {
                        url: "attachment://board.png"
                    }
                }],
                files: [attachment]
            });
            return { success: true, message: gameOverInfo.title };
        }

        if (!success) {
            await this.interaction.reply({
                embeds: [{
                    title: message,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = message;
            return { success: false, message };
        }

        await currentGame.msg.edit({
            embeds: [{
                title: "Chess",
                description:
                    `<@${currentGame.player1_id}>: ${currentGame.getColorName(currentGame.player1_id)}\n` +
                    `<@${currentGame.player2_id}>: ${currentGame.getColorName(currentGame.player2_id)}\n\n` +
                    `**Turn:** <@${currentGame.symbol_to_id[currentGame.game.turn()]}>\n\n`,
                color: this.colors["GARLIC"],
                image: {
                    url: "attachment://board.png"
                }
            }],
            files: [attachment]
        });

        await this.interaction.reply({
            embeds: [{
                title: message,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return { success: true, message };
    }

    async handleDraw(interaction, drawId) {
        this.interaction = interaction;
        
        if (!currentGame) {
            const msg = `No game running right now ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        if (interaction.user.id === currentGame.draw_offer) {
            const msg = `You can't decide for them y'know ${this.emote_map.sweat_1}`;
            await this.interaction.reply({
                embeds: [{
                    title: msg,
                    color: this.colors["RED"]
                }],
                flags: MessageFlags.Ephemeral
            });

            this.customErrMsg = msg;
            return { success: false, message: msg };
        }

        const attachment = new AttachmentBuilder(
            currentGame.boardBuffer,
            { name: "board.png" }
        );

        if (drawId === "accept") {
            await currentGame.msg.edit({
                embeds: [{
                    title: `Game Over — Draw`,
                    description: `<@${interaction.user.id}> vs <@${currentGame.draw_offer}>`,
                    color: this.colors["GARLIC"],
                    image: {
                        url: "attachment://board.png"
                    }
                }],
                files: [attachment],
                components: []
            });

            currentGame.game.reset();
            currentGame = null;
        }
        else if (drawId === "refuse") { 
            let buttons = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("chess:piece_select")
                        .setLabel("Select Piece")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("chess:draw")
                        .setLabel("Draw")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("chess:resign")
                        .setLabel("Resign")
                        .setStyle(ButtonStyle.Danger)
                )
            ];

            await currentGame.msg.edit({
                embeds: [{
                    title: "Chess",
                    description:
                        `<@${currentGame.player1_id}>: ${currentGame.getColorName(currentGame.player1_id)}\n` +
                        `<@${currentGame.player2_id}>: ${currentGame.getColorName(currentGame.player2_id)}\n\n` +
                        `**Turn:** <@${currentGame.symbol_to_id[currentGame.game.turn()]}>\n\n`,
                    color: this.colors["GARLIC"],
                    image: {
                        url: "attachment://board.png"
                    }
                }],
                files: [attachment],
                components: buttons
            });
        }

        const replyMsg = "Handled Draw";
        await this.interaction.reply({
            embeds: [{
                title: replyMsg,
                color: this.colors["GARLIC"]
            }],
            flags: MessageFlags.Ephemeral
        });

        return { success: true, message: replyMsg };
    }
}

export { Chess, chessInstance };