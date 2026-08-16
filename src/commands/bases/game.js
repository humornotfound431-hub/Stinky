import Command from "./command.js";

class Game extends Command {
    startTimeout(time) {
        this.timeout = setTimeout(() => {
            this.setCurrentGame(null);
        }, time * 1000);
    }

    resetTimeout(time = 300) {
        clearTimeout(this.timeout);
        this.startTimeout(time);
    }
}

export default Game;