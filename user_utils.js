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
}

export {
    get_user,
    add_cloves,
    subtract_cloves
};