import mongoose, { mongo } from "mongoose";

const user_schema = new mongoose.Schema({
    discord_id: {type: String, required: true, unique: true},
    cloves: {type: Number, default: 1000},
    streak_daily: {type: Number, default: 0},
    last_daily: {type: Date, default: null}
});

const User = mongoose.model("User", user_schema);
export default User;