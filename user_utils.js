import User from './models/user.js';

const get_user = async (discord_id) => {
    try {
        const user = await User.findOneAndUpdate(
            { discord_id },
            { $setOnInsert: { cloves: 1000 } },
            { upsert: true, returnDocument: "after" }
        );

        if (!user) throw new Error("No such user");

        return user;
    }
    catch (err) {
        console.error(err);
    }
};

const add_currency = async (discord_id, amount, session = null) => {
    return await User.findOneAndUpdate(
        { discord_id },
        { $inc: { cloves: amount } },
        { returnDocument: "after", upsert: true, session }
    );
};

const subtract_currency = async (discord_id, amount, session = null) => {
    return await User.findOneAndUpdate(
        { discord_id },
        [{ $set: { cloves: { $max:  [ { $subtract: ["$cloves", amount] }, 0] } } }],
        {
            returnDocument: "after",
            upsert: true,
            updatePipeline: true,
            session
        }
    );
};

const get_daily_info = async (discord_id, session = null) => {
    const daily_info = await User.findOneAndUpdate(
        { discord_id },
        { $setOnInsert: { discord_id } },
        {
            new: true,
            upsert: true,
            session
        }
    );

    return daily_info;
}

const update_daily = async (discord_id, streak, session = null) => {
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
        { discord_id },
        update,
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