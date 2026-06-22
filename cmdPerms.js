import config from './config.json' with { type: 'json' };

const {channels} = config;

// Test server
// 1488407905580351598 :: Text channels

// Garlic server
// 1487876883373883432 :: Community
// 1498159882359279778 :: Clove Casino
// 1488042622470852709 :: Mod/Admin
const commandChannelPerms = new Map([
    ["ping", null],
    ["random_joke", null],
    ["daily", new Set([channels['daily-cloves'], channels['test-server-general']])],    
    ["bet", new Set([channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["slots", new Set([channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["cloves", new Set([channels['garlic-gaming'], channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["donate", new Set([channels['garlic-gaming'], channels['garlic-gambling'], channels['bot-setup'], channels['test-server-general']])],
    ["help", null],
    ["tic-tac-toe", new Set([channels['garlic-gaming'], channels['bot-setup'], channels['test-server-general']])],
    ["chess", new Set([channels["garlic-gaming"], channels["test-server-general"]])]
]);

export default commandChannelPerms;