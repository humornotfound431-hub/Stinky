import Command from "./bases/command.js";
import { get_jokes } from "../interactions.js";

class Joke extends Command {
    async exec(args) {
        const { interaction } = args;

        await interaction.deferReply();

        const joke_obj = await get_jokes(1);
        const content = `${joke_obj.setup}\n\n${joke_obj.punchline}`;
        
        await interaction.editReply({ content });
    }
}

export {
    Joke
};