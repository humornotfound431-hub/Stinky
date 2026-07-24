import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import { add_currency, subtract_currency, get_user, update_daily, get_daily_info } from "./user_utils.js";
import { MessageFlags, EmbedBuilder } from "discord.js";
import config from './config.json' with { type: 'json' };
import fs from "fs";

const { emote_map, colors, images } = config;
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

    if (count == 1) {
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

const get_currency = async (id) => {
    const user = await get_user(id);
    return user.cloves;
};

const place_bet = async (amount, choice, channel, name, id, botName) => {
    const numRegex = /^(?:[0-9]|[12][0-9]|3[0-6])$/;
    const colorRegex = /^(?:red|green|black)$/i;
    const parityRegex = /^(?:even|odd)$/i;
    const currencyName = botName === "garlic" ? "cloves" : "batteries";
    let result_str = "";
    let loading;
    let msg;

    // Betting again after betting
    if (roulette_state.bets.some(b => b[2] == id)) {
        const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
        return {success: false, message: `You already bet in this round ${emote}`};
    }

    // Invalid args
    if (!numRegex.test(choice) && !colorRegex.test(choice) && !parityRegex.test(choice)) {
        const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
        return {success: false, message: `Invalid bet ${emote}`};
    }
    
    const user = await get_user(id);

    if (amount === "all") {
        amount = user.cloves;
    }
    else {
        amount = Number(amount);
    }

    if (amount === NaN || amount <= 0) {
        const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
        return {success: false, message: `Invalid amount ${emote}`};
    }
    
    // if user doesnt have enough cloves
    if (user.cloves < amount) {
        const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
        return {success: false, message: `You don't have enough ${currencyName} to gamba ${emote}`};
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
                        await subtract_currency(bet[2], changed);
                        return `${bet[3]}: -${changed} (Bet on ${bet[1]})\n`;
                    }
                    
                    if ((bet[1] == "green") || numRegex.test(bet[1])) {
                        await add_currency(bet[2], changed * 34);
                        changed = changed * 35;
                    }
                    else {
                        await add_currency(bet[2], changed);
                        changed = changed * 2;
                    }
                    
                    return `${bet[3]}: +${changed} (Bet on ${bet[1]})\n`;
                }
            ));

            result_str = results.join("");
            clearInterval(loading);

            let new_roulette_embed = {
                title: `Roulete rolled ${roulette_state.result[0]} ${roulette_state.result[1]}`,
                description: result_str,
                color: colors["GARLIC"],
                image: {
                    url: images[`${roulette_state.result[0]}`]
                }
            };
            
            roulette_state.reset();
            if (msg) await msg.edit({ embeds: [new_roulette_embed], });
            else {
                await channel.send({ embeds: [new_roulette_embed] });
            }
        }, 30000);

        roulette_state.bets.push([amount, choice, id, name]);

        const number = Math.floor(Math.random() * 37);
        let color;
        if (number == 0) color = "green";
        else if (roulette_state.reds.includes(number)) color = "red";
        else if (roulette_state.blacks.includes(number)) color = "black";

        roulette_state.result = [number, color, (number === 0) ? null : (number % 2) == 0 ? "even" : "odd"];

        let emote = botName === "garlic" ? emote_map[botName].SmugGarlic : emote_map[botName].KAPPARHEOBALD;
        msg = await channel.send({
            embeds: [
                {
                    title: `Roulette starting!! ${emote}`,
                    description: "Roulette will begin in 30 seconds, place your bets!",
                    color: colors["GARLIC"],
                    image: {
                        url: images["roulette_gif"]
                    }
                }
            ]
        });
        
        emote = botName === "garlic" ? emote_map[botName].smug : emote_map[botName].JimothyCricketSmol;
        return { success: true, message: `Your bet was placed ${emote}`};
    }

    roulette_state.bets.push([amount, choice, id, name]);

    let emote = botName === "garlic" ? emote_map[botName].smug : emote_map[botName].JimothyCricketSmol;
    return { success: true, message: `Your bet was placed ${emote}`};
};

const play_slots = async (interaction, amount, botName) => {
    try {
        const currencyName = botName === "garlic" ? "cloves" : "batteries";

        if (!amount) {
            let emote = botName === "garlic" ? emote_map[botName].peek : emote_map[botName].GoonerRheo;
            return {success: false, message: `Invalid options ${emote}`};
        }

        const user = await get_user(interaction.user.id);

        if (amount === "all") {
            amount = user.cloves;
        }
        else {
            amount = Number(amount);
        }

        if (amount === NaN || amount <= 0) {
            const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
            return {success: false, message: `Invalid amount ${emote}`};
        }
        else if (amount < 100) {
            const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
            return {success: false, message: `Invalid amount (Bet higher than 100) ${emote}`}
        }
   
        // if user doesnt have enough cloves
        if (user.cloves < amount) {
            const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
            return {success: false, message: `You don't have enough ${currencyName} to gamba ${emote}`};
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

            const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
            await subtract_currency(interaction.user.id, changed);
            message = `Oof that has to hurt ${emote}`;
            changed = -changed;
        }
        else if (results[0] === results[1] && results[1] === results[2]) {
            if (results[0] === "🧄") {
                // const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
                changed *= 50;
                message = `GARLIC JACKPOT!! ${emote_map.bigbrain}${emote_map.heart_1}${emote_map.smug}`;
            }
            else {
                changed *= 10;
                message = `3 in a row, how lucky ${emote_map.smug}`;
            }
            await add_currency(interaction.user.id, changed);
        }
        else if (results[0] === results[1] || results[1] === results[2] || results[2] === results[0]) {
            changed = Math.floor(changed * 0.5);
            message = `Nice luck! Have some ${currencyName} as reward ${emote_map.heart_1}`;
            await add_currency(interaction.user.id, changed);
        }
        else {
            await subtract_currency(interaction.user.id, changed);
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

const donate_currency = async (user_id, target_id, user_name, target_name, amount) => {
    const session = await mongoose.startSession();
    
    try {
        const currencyName = botName === "garlic" ? "cloves" : "batteries";
        session.startTransaction();

        if (!user_id || !target_id || !user_name || !target_name || !amount) {
            let emote = botName === "garlic" ? emote_map[botName].peek : emote_map[botName].GoonerRheo;
            return {success: false, message: `Invalid options ${emote}`};
        }

        const user_db = await get_user(user_id);

        if (amount === "all") {
            amount = user_db.cloves;
        }
        else {
            amount = Number(amount);
        }

        if (amount === NaN || amount <= 0) {
            const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
            return {success: false, message: `Invalid amount ${emote}`};
        }

        if (user_db.cloves < amount) {
            const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
            return {success: false, message: `You don't have enough ${currencyName} to donate ${emote}`};
        }

        await add_currency(target_id, amount, session);
        await subtract_currency(user_id, amount, session);

        await session.commitTransaction();
        const emote = botName === "garlic" ? emote_map[botName].heart_1 : emote_map[botName].HappyRheo;
        return {success: true, message: `${user_name} donated ${amount} ${currencyName} to ${target_name} ${emote}`};
    }
    catch (err) {
        await session.abortTransaction();
        const emote = botName === "garlic" ? emote_map[botName].crying : emote_map[botName].SadRheo;
        return {success: false, message: `Some stoopid error occured ${emote}`};
    }
    finally {
        session.endSession();
    }
};

const check_daily = async (discord_id) => {
    // When user uses the command, first we get last daily, if the diff between now and last daily is more than 24 hours, we update_daily with streak true, if not, then streak breaks
    const daily_info = await get_daily_info(discord_id);
    const now = Date.now();
    const last_daily_time = (daily_info.last_daily !== null) ? daily_info.last_daily.getTime() : new Date(0).getTime();
    const difference = now - last_daily_time;
    const day = 24 * 60 * 60 * 1000;

    if (difference <= day) {
        const time_remaining = (last_daily_time + day) - now;

        const hours = Math.floor(time_remaining / (1000 * 60 * 60));
        const minutes = Math.floor((time_remaining % (1000 * 60 * 60)) / (1000 * 60));

        return {success: false, message: `Cannot check in. Try again in ${hours}h ${minutes}m ${emote_map["garlic"].heart_1}`};
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        let streak;

        if (difference > day * 2) {
            await update_daily(discord_id, false, session);
            streak = 0;
        }
        else {
            await update_daily(discord_id, true, session);
            streak = daily_info.streak_daily + 1;
        }

        let amount = 0;
        
        if (streak <= 7) amount = 200;
        else if (streak <= 14) amount = 400;
        else if (streak <= 21) amount = 600;
        else if (streak <= 28) amount = 800;
        else amount = 1000;

        await add_currency(discord_id, amount, session);

        await session.commitTransaction();
        return {success: true, message: `Here's your daily check in cloves ${emote_map["garlic"].smug}`, streak, amount};
    }
    catch (err) {
        await session.abortTransaction();
        console.error("[ERROR]", err.message);
        return {success: false, message: `Some stoopid error occured ${emote_map["garlic"].crying}`};
    }
    finally {
        session.endSession();
    }
};

const TEST_FUNCS = {
    
};

export {
    TEST_FUNCS,
    get_jokes,
    place_bet,
    get_currency,
    donate_currency,
    play_slots,
    check_daily
};