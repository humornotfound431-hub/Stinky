import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import { add_cloves, subtract_cloves, get_user, update_daily, get_last_daily, get_streak } from "./user_utils.js";
import { MessageFlags, EmbedBuilder } from "discord.js";
import config from './config.json' with { type: 'json' };

const { emote_map, colors } = config;
configDotenv();

const roulette_state = {
    active: false,
    bets: [], // [[]]
    result: [],
    timeout: null,
    reds: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],
    blacks: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35],
    reset: function() {
        this.active = false;
        this.bets.length = 0;
        this.result.length = 0;
        this.timeout = null;
    }
};

const slot_options = [
    "💀","💀",
    "🧅","🧅","🧅",
    "🥕","🥕","🥕",
    "🥔","🥔","🥔",
    "🧄","🧄"
];

const get_jokes = async (count) => {
    let response;

    if (count === 1) {
        response = await fetch('https://official-joke-api.appspot.com/jokes/random');
    }
    else if (count > 1 && count <= 150) {
        response = await fetch('https://official-joke-api.appspot.com/jokes/ten');
    }
    else {
        return "Invalid. Try again later";
    }

    if (!response.ok) {
        const msg = await response.text();
        console.error(msg);
        return "Ahh an unexpected error occured";
    }

    const data = await response.json()
    return data;
};

const get_cloves = async (id) => {
    const user = await get_user(id);
    return user.cloves;
};

const place_bet = async (amount, choice, channel, name, id) => {
    const numRegex = /^(?:[0-9]|[12][0-9]|3[0-6])$/;
    const colorRegex = /^(?:red|green|black)$/i;
    const parityRegex = /^(?:even|odd)$/i;
    let result_str = "";
    let loading;
    let msg;

    // Betting again after betting
    if (roulette_state.bets.some(b => b[2] == id)) {
        return {success: false, message: `You already bet in this round ${emote_map.crying}`};
    }

    // Invalid args
    if (!numRegex.test(choice) && !colorRegex.test(choice) && !parityRegex.test(choice)) {
        return {success: false, message: `Invalid bet ${emote_map.crying}`};
    }
    
    const user = await get_user(id);

    if (amount === "all") {
        amount = user.cloves;
    }
    else {
        amount = Number(amount);
    }

    if (amount === NaN || amount <= 0) {
        return {success: false, message: `Invalid amount ${emote_map.crying}`};
    }
    
    // if user doesnt have enough cloves
    if (user.cloves < amount) {
        return {success: false, message: `You don't have enough cloves to gamba ${emote_map.crying}`};
    }

    // First bet
    if (!roulette_state.active) {
        roulette_state.active = true;

        roulette_state.timeout = setTimeout(async () => {
            const results = await Promise.all(
                roulette_state.bets.map(async (bet) => {
                    // bet = [amount, choice, id, name]

                    let changed = bet[0]; // Initial val is the bet amount
                    const lost_condition = (numRegex.test(bet[1]) && bet[1] != roulette_state.result[0]) ||
                                            (colorRegex.test(bet[1]) && bet[1] != roulette_state.result[1]) ||
                                            (parityRegex.test(bet[1]) && bet[1] != roulette_state.result[2]);

                    if (lost_condition) {
                        await subtract_cloves(bet[2], changed);
                        return `${bet[3]}: -${changed} (Bet on ${bet[1]})\n`;
                    }
                    
                    if ((bet[1] == "green") || numRegex.test(bet[1])) {
                        await add_cloves(bet[2], changed * 34);
                        changed = changed * 35;
                    }
                    else {
                        await add_cloves(bet[2], changed);
                        changed = changed * 2;
                    }
                    
                    return `${bet[3]}: +${changed} (Bet on ${bet[1]})\n`;
                }
            ));

            result_str = results.join("");
            clearInterval(loading);

            let new_roulette_embed = new EmbedBuilder()
                .setTitle(`Roulette rolled ${roulette_state.result[0]} ${roulette_state.result[1]}`)
                .setDescription(result_str)
                .setColor(colors["GARLIC"]);
            
            roulette_state.reset();
            await msg.edit({ embeds: [new_roulette_embed] });
        }, 30000);

        roulette_state.bets.push([amount, choice, id, name]);

        const number = Math.floor(Math.random() * 37);
        let color;
        if (number == 0) color = "green";
        else if (roulette_state.reds.includes(number)) color = "red";
        else if (roulette_state.blacks.includes(number)) color = "black";

        roulette_state.result = [number, color, (number === 0) ? null : (number % 2) == 0 ? "even" : "odd"];

        let roulette_embed = new EmbedBuilder()
            .setTitle(`Roulette starting!! ${emote_map.SmugGarlic}`)
            .setDescription("Roulette will begin in 30 seconds, place your bets!")
            .setColor(colors["GARLIC"])
            .addFields(
                { name: "\u200B", value: "." }
            );

        msg = await channel.send({ embeds: [roulette_embed] });
        return { success: true, message: `Your bet was placed ${emote_map.smug}`};
    }

    roulette_state.bets.push([amount, choice, id, name]);
    return { success: true, message: `Your bet was placed ${emote_map.smug}`};
};

const play_slots = async (interaction, amount) => {
    try {
        if (!amount) {
            return {success: false, message: `Invalid options ${emote_map.peek}`};
        }

        const user = await get_user(interaction.user.id);

        if (amount === "all") {
            amount = user.cloves;
        }
        else {
            amount = Number(amount);
        }

        if (amount === NaN || amount <= 0) {
            return {success: false, message: `Invalid amount ${emote_map.crying}`};
        }
        else if (amount < 100) return {success: false, message: `Invalid amount (Bet higher than 100) ${emote_map.crying}`}
   
        // if user doesnt have enough cloves
        if (user.cloves < amount) {
            return {success: false, message: `You don't have enough cloves to gamba ${emote_map.crying}`};
        }

        let message;
        const results = [
            slot_options[Math.floor(Math.random() * slot_options.length)],
            slot_options[Math.floor(Math.random() * slot_options.length)],
            slot_options[Math.floor(Math.random() * slot_options.length)]
        ];

        let changed = amount;

        const skull_count = results.filter(elem => elem === "💀").length;
        if (skull_count > 1) {
            switch (skull_count) {
                case 2:
                    changed *= 2;
                    break;
                case 3:
                    changed *= 4;
            }
            await subtract_cloves(interaction.user.id, changed);
            message = `Oof that has to hurt ${emote_map.crying}`;
            changed = -changed;
        }
        else if (results[0] === results[1] && results[1] === results[2]) {
            if (results[0] === "🧄") {
                changed *= 50;
                message = `GARLIC JACKPOT!! ${emote_map.bigbrain}${emote_map.heart_1}${emote_map.smug}`;
            }
            else {
                changed *= 10;
                message = `3 in a row, how lucky ${emote_map.smug}`;
            }
            await add_cloves(interaction.user.id, changed);
        }
        else if (results[0] === results[1] || results[1] === results[2] || results[2] === results[0]) {
            changed = Math.floor(changed * 1.5);
            message = `Nice luck! Have some cloves as reward ${emote_map.heart_1}`;
            await add_cloves(interaction.user.id, changed);
        }
        else {
            await subtract_cloves(interaction.user.id, changed);
            message = `99% gamblers quit before they win big ${emote_map.smug}`;
            changed = -changed;
        }

        return {success: true, message, changed: (changed < 1) ? `${changed}` : `+${changed}`, results};
    }
    catch (err) {
        console.log(err.message);
        return {success: false, message: `Some stoopid error occured ${emote_map.crying}`};
    }
};

const donate_cloves = async (user_id, target_id, user_name, target_name, amount) => {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        if (!user_id || !target_id || !user_name || !target_name || !amount) {
            return {success: false, message: `Invalid options ${emote_map.peek}`};
        }

        const user_db = await get_user(user_id);

        if (amount === "all") {
            amount = user_db.cloves;
        }
        else {
            amount = Number(amount);
        }

        if (amount === NaN || amount <= 0) {
            return {success: false, message: `Invalid amount ${emote_map.crying}`};
        }

        if (user_db.cloves < amount) {
            return {success: false, message: `You don't have enough cloves to donate ${emote_map.crying}`};
        }

        await add_cloves(target_id, amount, session);
        await subtract_cloves(user_id, amount, session);

        await session.commitTransaction();
        return {success: true, message: `${user_name} donated ${amount} cloves to ${target_name} ${emote_map.heart_1}`};
    }
    catch (err) {
        await session.abortTransaction();
        return {success: false, message: `Some stoopid error occured ${emote_map.crying}`};
    }
    finally {
        session.endSession();
    }
};

const check_daily = async (discord_id) => {
    // When user uses the command, first we get last daily, if the diff between now and last daily is more than 24 hours, we update_daily with streak true, if not, then streak breaks
    const daily_info = await get_last_daily(discord_id);
    const now = Date.now();
    const last_daily_time = (daily_info.last_daily !== null) ? daily_info.last_daily.getTime() : new Date(0).getTime();
    const difference = now - last_daily_time;
    const day = 24 * 60 * 60 * 1000;

    if (difference <= day) {
        const time_remaining = (last_daily_time + day) - now;

        const hours = Math.floor(time_remaining / (1000 * 60 * 60));
        const minutes = Math.floor((time_remaining % (1000 * 60 * 60)) / (1000 * 60));

        return {success: false, message: `Cannot check in. Try again in ${hours}h ${minutes}m ${emote_map.heart_1}`};
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        if (difference > day * 2) await update_daily(discord_id, false, session);
        else await update_daily(discord_id, true, session);

        const {streak_daily} = await get_streak(discord_id, session);
        let amount = 0;
        
        if (streak_daily <= 7) amount = 100;
        else if (streak_daily <= 14) amount = 200;
        else if (streak_daily <= 21) amount = 300;
        else if (streak_daily <= 28) amount = 400;
        else amount = 500;

        await add_cloves(discord_id, amount, session);

        await session.commitTransaction();
        return {success: true, message: `Here's your daily check in cloves ${emote_map.smug}`, streak_daily, amount};
    }
    catch (err) {
        await session.abortTransaction();
        console.error("[ERROR]", err.message);
        return {success: false, message: `Some stoopid error occured ${emote_map.crying}`};
    }
    finally {
        session.endSession();
    }
};

export {
    get_jokes,
    place_bet,
    get_cloves,
    donate_cloves,
    play_slots,
    check_daily
};