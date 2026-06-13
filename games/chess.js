import { Chess } from "chess.js";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import { get_user, add_cloves, subtract_cloves } from "../user_utils.js";
import config from "../config.json" with { type: "json" };

const { emote_map } = config;
const BOARD_SIZE = 800;
const board_image = await loadImage("./images/board.png");

const pieces = {
    "rb": await loadImage("./images/rb.png"),
    "nb": await loadImage("./images/nb.png"),
    "bb": await loadImage("./images/bb.png"),
    "qb": await loadImage("./images/qb.png"),
    "kb": await loadImage("./images/kb.png"),
    "pb": await loadImage("./images/pb.png"),

    "rw": await loadImage("./images/rw.png"),
    "nw": await loadImage("./images/nw.png"),
    "bw": await loadImage("./images/bw.png"),
    "qw": await loadImage("./images/qw.png"),
    "kw": await loadImage("./images/kw.png"),
    "pw": await loadImage("./images/pw.png"),

    "blank_w": await loadImage("./images/light_empty.png"),
    "blank_b": await loadImage("./images/dark_empty.png")
};

class Chess_Game {
    constructor(id1) {
        this.player1_id = id1;
        this.canvas = createCanvas(BOARD_SIZE, BOARD_SIZE)
        this.canvas_context = this.canvas.getContext("2d");
        this.canvas_context.drawImage(board_image, 0, 0, BOARD_SIZE, BOARD_SIZE);

        this.game = new Chess();
        this.update_board();
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

        this.winner = null;
        this.ended = false;
    }

    make_move(id, move) {
        if (this.id_to_symbol[id] !== this.game.turn()) return {success: false, message: "Not your turn"};

        try {
            const move_info = this.game.move(move);
            const isGameOver = this.game.isGameOver();
            let gameOverInfo = null;

            const new_board = this.update_board();

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

    update_board() {
        const board = this.game.board();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let sqaure_fill = (j + i) % 2 === 1 ? "blank_b" : "blank_w";
                this.canvas_context.drawImage(pieces[sqaure_fill], j * (BOARD_SIZE / 8), i * (BOARD_SIZE / 8), (BOARD_SIZE / 8), (BOARD_SIZE / 8));

                if (board[i][j] !== null) {
                    sqaure_fill = board[i][j].type + board[i][j].color;
                    this.canvas_context.drawImage(pieces[sqaure_fill], j * (BOARD_SIZE / 8), i * (BOARD_SIZE / 8), (BOARD_SIZE / 8), (BOARD_SIZE / 8));
                }
            }
        }
    }

    getColorName (id) {
        return this.id_to_symbol[id] === "w" ? "White" : "Black";   
    }
}

const instance = new Chess_Game();

// instance.make_move(instance.player1_id, "e4");
// instance.make_move(instance.player2_id, "e5");

// instance.make_move(instance.player1_id, "Nf3");
// instance.make_move("b", "Nc6");

// instance.make_move("w", "Bc4");
// instance.make_move("b", "Bc5");

// instance.make_move("w", "O-O");

const TEST_FUNCS = {
    "make_move": (...args) => instance.make_move(...args),
    "update_board": (...args) => instance.update_board(...args)
};
export {TEST_FUNCS, Chess_Game};