import { createLogger, transports, format } from "winston";
import { createWriteStream, writeFile } from "fs";

export const winston = createLogger({
    // transports: [
    //     new transports.Stream({
    //         stream: createWriteStream('./log.log'),
    //     }),
    // ],
    format: format.combine(
        format.colorize(),
        format.splat(),
        format.printf(({ timestamp, level, message }) => {
            let str = `[${new Date().toISOString()}] ${level}: ${message}`;
            console.log(str);
            return str;
        })
    ),
    defaultMeta: {
        service: "Partyfy",
    },
});
        