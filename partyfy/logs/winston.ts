import { createLogger, format, transports } from "winston";

export const winston = createLogger({
    transports: [new transports.Console()],
    format: format.combine(
        format.colorize(),
        format.splat(),
        format.printf(({ timestamp, level, message }) => {
            let str = `[${new Date().toISOString()}] ${level}: ${message}`;
            return str;
        })
    ),
    defaultMeta: {
        service: "Partyfy",
    },
});
        