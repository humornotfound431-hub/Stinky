import config from '../config.json' with { type: 'json' };

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
    ["help", null],
    ["daily", new Set([
        channels['daily-cloves'],
        channels['test-server-general'],
        channels["daily-battery"]
    ])],    
    ["bet", new Set([
        channels['garlic-gambling'],
        channels['test-server-general'],
        channels["gamba"]
    ])],
    ["slots", new Set([
        channels['garlic-gambling'],
        channels['test-server-general']
    ])],
    ["cloves", new Set([
        channels['garlic-gaming'],
        channels['garlic-gambling'],
        channels['test-server-general'],
        channels["gamba"]
    ])],
    ["batteries", new Set([
        channels['garlic-gaming'],
        channels['garlic-gambling'],
        channels['test-server-general'],
        channels["gamba"]
    ])],
    ["donate", new Set([
        channels['garlic-gaming'],
        channels['garlic-gambling'],
        channels['test-server-general'],
        channels["gamba"]
    ])],
    ["tic-tac-toe", new Set([
        channels['garlic-gaming'],
        channels['test-server-general'],
        channels["gaming"]
    ])],
    ["chess", new Set([
        channels["garlic-gaming"],
        channels["test-server-general"],
        channels["gaming"]
    ])]
]);

export default commandChannelPerms;