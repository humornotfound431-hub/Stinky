import Command from "./command.js";
import { get_sorted_streaks } from "../user_utils.js";
import { check_daily } from "../interactions.js";
import { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

async function getLeaderboard(emote_map, colors) {
    const leaderboard = await get_sorted_streaks();

    let desc = "Claim your daily cloves using the button below\n\n**Streak Leaderboard:**\n\n";

    leaderboard.forEach((user, index) => {
        desc += `${index + 1}. <@${user.discord_id}>: ${user.streak_daily}\n`;
    });

    return {
        title: `${emote_map.blob} Daily Cloves ${emote_map.blob}`,
        description: desc,
        color: colors["GARLIC"]
    };
}

class Daily extends Command {
    async exec(args) {
        this.interaction = args.interaction;

        await this.interaction.deferReply({});

        const embed = await getLeaderboard(this.emote_map, this.colors);

        await this.interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("daily:claim")
                        .setEmoji("🧄")
                        .setStyle(ButtonStyle.Success)
                )
            ]
        });
    }

    static async claim(interaction, emote_map, colors) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const {success, message, streak, amount} = await check_daily(interaction.user.id);

        if (success) {
            const embed = await getLeaderboard(emote_map, colors);
            this.interaction.message.edit({
                embeds: [embed],
                components: interaction.message.components
            });
        }

        await interaction.editReply({
            embeds: [{
                title: message,
                description: success ? `+${amount} (${streak} day streak)` : "",
                color: success ? colors["GARLIC"] : colors["RED"]
            }]
        });

        return {success, message};
    }
}

export {
    Daily
};