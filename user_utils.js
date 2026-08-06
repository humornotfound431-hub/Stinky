import User from './models/user.js';

const get_user = async (userInfo) => {
    try {
        const user = await User.findOneAndUpdate(
            { discord_id: userInfo.discord_id },
            { $setOnInsert: { cloves: 1000, discord_id: userInfo.discord_id }, $addToSet: { guilds: userInfo.guildId } },
            { upsert: true, returnDocument: "after" }
        );

        if (!user) throw new Error("No such user");

        return user;
    }
    catch (err) {
        console.error(err);
    }
};

const add_currency = async (userInfo, amount, session = null) => {
    return await User.findOneAndUpdate(
        { discord_id: userInfo.discord_id },
        { $inc: { cloves: amount }, $addToSet: { guilds: userInfo.guildId } },
        { returnDocument: "after", upsert: true, session }
    );
};

const subtract_currency = async (userInfo, amount, session = null) => {
    return await User.findOneAndUpdate(
        { discord_id: userInfo.discord_id },
        [
            {
                $set: {
                    discord_id: userInfo.discord_id,
                    cloves: {
                        $max: [
                            {
                                $subtract: [
                                    { $ifNull: ["$cloves", 0] },
                                    amount
                                ]
                            },
                            0
                        ]
                    },
                    guilds: {
                        $setUnion: [
                            { $ifNull: ["$guilds", []] },
                            [userInfo.guildId]
                        ]
                    }
                }
            }
        ],
        {
            returnDocument: "after",
            upsert: true,
            updatePipeline: true,
            session
        }
    );
};

const get_daily_info = async (userInfo, session = null) => {
    const daily_info = await User.findOneAndUpdate(
        { discord_id: userInfo.discord_id },
        { $setOnInsert: { discord_id: userInfo.discord_id }, $addToSet: { guilds: userInfo.guildId } },
        {
            returnDocument: "after",
            upsert: true,
            session
        }
    );

    return daily_info;
}

const update_daily = async (userInfo, streak, session = null) => {
    const update = streak ? {
        $inc: { streak_daily: 1 },
        $set: { last_daily: new Date() }
    } : {
        $set: {
            streak_daily: 0,
            last_daily: new Date()
        }
    };

    return await User.findOneAndUpdate(
        { discord_id: userInfo.discord_id },
        { ...update, $addToSet: { guilds: userInfo.guildId } },
        { session }
    );
};

const get_sorted_streaks = async (guildId) => {
    return await User.find({ guilds: guildId }).select("discord_id streak_daily").sort({ streak_daily: -1 }).limit(10);
};

export {
    get_user,
    add_currency,
    subtract_currency,
    update_daily,
    get_daily_info,
    get_sorted_streaks
};