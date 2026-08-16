import Command from "./bases/command.js";
import { get_sorted_streaks } from "../../user_utils.js";
import { check_daily } from "../interactions.js";
import { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

async function getLeaderboard(emote_map, colors, guildId, botName) {
    const leaderboard = await get_sorted_streaks(guildId);

    let desc = "Claim your daily reward using the button below\n\n**Streak Leaderboard:**\n\n";

    leaderboard.forEach((user, index) => {
        desc += `${index + 1}. <@${user.discord_id}>: ${user.streak_daily}\n`;
    });

    const emote = botName === "garlic" ? emote_map.blob : emote_map.KAPPARHEO;
    return {
        title: `${emote} Daily Reward ${emote}`,
        description: desc,
        color: colors["GARLIC"]
    };
}

class Daily extends Command {
    async exec(args) {
        this.interaction = args.interaction;
        const botName = this.interaction.botName;

        await this.interaction.deferReply({});

        const embed = await getLeaderboard(this.emote_map, this.colors, this.interaction.guildId, botName);

        await this.interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("daily:claim")
                        .setEmoji(botName === "garlic" ? "🧄" : "🔋")
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        });
    }

    static async claim(interaction, emote_map, colors) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const {success, message, streak, amount} = await check_daily({guildId: interaction.guildId, discord_id: interaction.user.id}, interaction.botName);

        const embed = await getLeaderboard(emote_map, colors, interaction.guildId, interaction.botName);
        interaction.message.edit({
            embeds: [embed],
            components: interaction.message.components
        });

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