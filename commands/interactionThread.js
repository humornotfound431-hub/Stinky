import Command from "./bases/command.js";
import config from '../config.json' with { type: 'json' };
import { MessageFlags } from "discord.js";

const { channels } = config;

class IntermissionThread extends Command {
    async exec(args) {
        const { interaction, client } = args;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const forumChannel = await client.channels.fetch(channels["test"]);
        const active = await forumChannel.threads.fetchActive();

        if (active.threads.size > 0) {
            await Promise.all(
                [...active.threads.values()].map(async (thread) => {
                    await thread.setLocked(true);
                    await thread.setArchived(true);
                })
            );
        }

        const date = new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        const post = await forumChannel.threads.create({
            name: `Intermission Videos (${date})`,
            message: {
                content: 'This is the where the things go in the thing, I think'
            },
            autoArchiveDuration: 60,
            rateLimitPerUser: 369 // 6 * 60 + 9
        });

        const archived = await forumChannel.threads.fetchArchived();

        const oldestArchives = [...archived.threads.values()].slice(2);
        for (let thread of oldestArchives) {
            await thread.delete();
        }

        setTimeout(async () => {
            try {
                await post.setLocked(true);
                await post.setArchived(true);
            } catch (err) {
                console.error(err);
            }
        }, 6 * 60 * 1000 + 9 * 1000);

        await interaction.editReply({ content: "I did it boss" });
        return { success: true, message: "Did the thing" };
    }
}

export {
    IntermissionThread
};