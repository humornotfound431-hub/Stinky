import { Chess } from "chess.js";
import fs from "fs";
import { get_user, add_cloves, subtract_cloves } from "../user_utils.js";
import config from "../config.json" with { type: "json" };
import sharp from "sharp";

const { emote_map } = config;
const BOARD_SIZE = 800;

const loadImage = (path) => fs.readFileSync(path);

const board_image = loadImage("./images/board.png");
const pieces = {
    "rb": loadImage("./images/rb.png"),
    "nb": loadImage("./images/nb.png"),
    "bb": loadImage("./images/bb.png"),
    "qb": loadImage("./images/qb.png"),
    "kb": loadImage("./images/kb.png"),
    "pb": loadImage("./images/pb.png"),

    "rw": loadImage("./images/rw.png"),
    "nw": loadImage("./images/nw.png"),
    "bw": loadImage("./images/bw.png"),
    "qw": loadImage("./images/qw.png"),
    "kw": loadImage("./images/kw.png"),
    "pw": loadImage("./images/pw.png"),

    "blank_w": loadImage("./images/light_empty.png"),
    "blank_b": loadImage("./images/dark_empty.png")
};

const resizedPieces = {};
for (const [key, buf] of Object.entries(pieces)) {
    resizedPieces[key] = await sharp(buf).resize(BOARD_SIZE / 8, BOARD_SIZE / 8).png().toBuffer();
}

const resizedBoard = await sharp(board_image)
    .resize(BOARD_SIZE, BOARD_SIZE)
    .png()
    .toBuffer();

class Chess_Game {
    constructor(id1) {
        this.player1_id = id1;
        this.game = new Chess();
        this.boardBuffer = null;
    }

    async start() {
        this.player1 = await get_user(this.player1_id);
        this.player2 = await get_user(this.player2_id);

        const symbol_random = Math.random();
        if (symbol_random > 0.5) {
            this.id_to_symbol = { [this.player1_id]: "w", [this.player2_id]: "b" };
            this.symbol_to_id = { "w": this.player1_id, "b": this.player2_id };
        }
        else {
            this.id_to_symbol = { [this.player1_id]: "b", [this.player2_id]: "w" };
            this.symbol_to_id = { "b": this.player1_id, "w": this.player2_id };
        }

        this.boardBuffer = await this.update_board();
    }

    async make_move(id, move) {
        if (this.id_to_symbol[id] !== this.game.turn()) return {success: false, message: "Not your turn"};

        try {
            const move_info = this.game.move(move);
            const isGameOver = this.game.isGameOver();
            let gameOverInfo = null;

            this.boardBuffer = await this.update_board();

            if (isGameOver) {
                gameOverInfo = this.handleGameOver();
            }

            return {
                success: true,
                message: "Piece moved",
                isGameOver,
                gameOverInfo
            };
        }
        catch (err) {
            return {success: false, message: err.message};
        }
    }

    handleGameOver() {
        if (this.game.isCheckmate()) {
            const winnerId = this.game.turn() === "w" ? this.symbol_to_id["b"] : this.symbol_to_id["w"];
            return { title: "Game Over — Checkmate", message: `<@${winnerId}> wins!!` };
        }
        else if (this.game.isStalemate()) {
            return { title: "Game Over — Stalemate", message: "It's a draw! No legal moves available." };
        }
        else if (this.game.isInsufficientMaterial()) {
            return { title: "Game Over — Insufficient Material", message: "It's a draw! Neither player has enough pieces to checkmate." };
        }
        else if (this.game.isThreefoldRepetition()) {
            return { title: "Game Over — Threefold Repetition", message: "It's a draw! The same position occurred 3 times." };
        }
        else if (this.game.isDraw()) {
            return { title: "Game Over — Draw", message: "It's a draw! 50-move rule reached." };
        }
    }

    async update_board() {
        const board = this.game.board();
        const composites = [];

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const top = i * (BOARD_SIZE / 8);
                const left = j * (BOARD_SIZE / 8);

                let sqaure_fill = (j + i) % 2 === 1 ? "blank_b" : "blank_w";
                composites.push({ input: resizedPieces[sqaure_fill], top, left });

                if (board[i][j] !== null) {
                    sqaure_fill = board[i][j].type + board[i][j].color;
                    composites.push({ input: resizedPieces[sqaure_fill], top, left });
                }
            }
        }

        return await sharp(resizedBoard)
            .composite(composites)
            .png()
            .toBuffer();
    }

    getColorName (id) {
        return this.id_to_symbol[id] === "w" ? "White" : "Black";   
    }
}

const instance = new Chess_Game();

const TEST_FUNCS = {
    
};

export {TEST_FUNCS, Chess_Game};