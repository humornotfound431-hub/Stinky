import { get_user, add_currency, subtract_currency } from "../../user_utils.js";
import config from "../../config.json" with { type: "json" };

const { emote_map } = config;

class TicTacToe {
    constructor(id1, bet) {
        this.player1_id = id1;
        this.bet = bet;
    }

    async start() {
        this.player1 = await get_user(this.player1_id);
        this.player2 = await get_user(this.player2_id);
        this.turn = Math.random() > 0.5 ? this.player1_id : this.player2_id;

        const symbol_random = Math.random();
        if (symbol_random > 0.5) {
            this.id_to_symbol = { [this.player1_id]: "⭕", [this.player2_id]: "❌" };
            this.symbol_to_id = { "⭕": this.player1_id, "❌": this.player2_id };
        }
        else {
            this.id_to_symbol = { [this.player1_id]: "❌", [this.player2_id]: "⭕" };
            this.symbol_to_id = { "❌": this.player1_id, "⭕": this.player2_id };
        }

        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];

        this.winner = null;
        this.ended = false;
    }

    async place_mark(id, position) {
        if (this.turn !== id) {
            return {success: false, message: `It's not your turn ${emote_map.peek}`};
        }

        let row = Math.floor((position - 1) / 3);
        let col = (position - 1) % 3;

        if (this.board[row][col] !== "") return {success: false, message: `Cell already taken ${emote_map.sweat}`};

        this.board[row][col] = this.id_to_symbol[id];
        this.turn = (this.turn === this.player1_id) ? this.player2_id : this.player1_id;

        if (this.check_win()) {
            if (this.bet !== null) {
                await add_currency(this.winner, this.bet);
                await subtract_currency(this.winner === this.player1_id ? this.player1_id : this.player2_id, this.bet);
            }
            return {success: true, winner: this.winner, board: this.board};
        }
        if (this.check_draw()) return {success: true, draw: true, board: this.board};

        return {success: true, board: this.board};
    }

    check_win() {
        // Rows
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] !== "" && this.board[i][0] === this.board[i][1] && this.board[i][1] === this.board[i][2]) {
                this.winner = this.symbol_to_id[this.board[i][0]];
                this.ended = true;
                return true;
            }
        }

        // Columns
        for (let i = 0; i < 3; i++) {
            if (this.board[0][i] !== "" && this.board[0][i] === this.board[1][i] && this.board[1][i] === this.board[2][i]) {
                this.winner = this.symbol_to_id[this.board[0][i]];
                this.ended = true;
                return true;
            }
        }

        // Diagonals
        if (this.board[0][0] !== "" && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
            this.winner = this.symbol_to_id[this.board[0][0]];
                this.ended = true;
                return true;
        }

        if (this.board[0][2] !== "" && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
            this.winner = this.symbol_to_id[this.board[0][2]];
                this.ended = true;
                return true;
        }

        return false;
    }

    check_draw() {
        for (let row of this.board) {
            for (let cell of row) {
                if (cell === "") return false;
            }
        }

        return true;
    }
}

export default TicTacToe;