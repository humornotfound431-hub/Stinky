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

const add_cloves = async (discord_id, amount, session = null) => {
    return await User.findOneAndUpdate(
        { discord_id },
        { $inc: { cloves: amount } },
        { returnDocument: "after", upsert: true, session }
    );
};

const subtract_cloves = async (discord_id, amount, session = null) => {
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

const get_last_daily = async (discord_id, session = null) => {
    const daily_info = await User.findOne({ discord_id }, "last_daily streak_daily", { session });
    return daily_info;
}

const get_streak = async (discord_id, session = null) => {
    return await User.findOne({ discord_id }).select("streak_daily");
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

const get_sorted_streaks = async () => {
    return await User.find().select("discord_id streak_daily").sort({ streak_daily: -1 }).limit(10);
};

export {
    get_user,
    add_cloves,
    subtract_cloves,
    update_daily,
    get_last_daily,
    get_streak,
    get_sorted_streaks
};