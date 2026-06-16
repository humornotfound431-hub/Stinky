import fs from "fs";

function log(userName, userId, interactionName, type, err = null) {
    let info = {userId, userName, type, interactionName, timestamp: new Date().toISOString(), error: false};

    if (err) {
        const errorLog = {
            name: err.name,
            message: err.message,
            stack: err.stack
        };

        info.error = true;
        info.errorLog = errorLog;
    }

    let logFileNum = +fs.readFileSync("./logs/logTracker.txt", "utf8");

    let logFilePath = `./logs/log${logFileNum}.jsonl`;
    if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        const sizeInMb = stats.size / (1024 * 1024);

        if (sizeInMb > 1) {
            if (logFileNum == 10) {
                logFileNum = 1;
            }
            else {
                logFileNum += 1;
            }

            logFilePath = `./logs/log${logFileNum}.jsonl`;
            fs.writeFileSync(logFilePath, "");
        }

        fs.writeFileSync("./logs/logTracker.txt", String(logFileNum));
    }

    fs.appendFileSync(
        logFilePath,
        JSON.stringify(info) + "\n"
    );
}

const TEST_FUNCS = {
    "log": (...args) => log(...args)
};

export {TEST_FUNCS, log};