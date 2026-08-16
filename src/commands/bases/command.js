import commandChannelPerms from "../../cmdPerms.js";
import config from '../../../config.json' with { type: 'json' };

const { emote_map, colors } = config;

class Command {
    static async init(args) {
        try {
            const instance = new this(args);
            return await instance.exec(args);
        }
        catch (err) {
            return {success: false, message: err.message, customMsg: ""};
        }
    }

    constructor(args) {
        this.emote_map = emote_map[args.interaction.botName];
        this.colors = colors;
        this.customMsg = "";
    }

    async exec(args) {
        console.log("Command prototype\nArgs:\n", args);
    }
}

export default Command;