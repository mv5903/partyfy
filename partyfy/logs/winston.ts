import { createLogger, format, transports } from "winston";
const HttpTransport = require('./customTransport');

export const winston = createLogger({
    transports: [
        new transports.Console(),
        new HttpTransport({ url: process.env.LOG_STREAM_URL })
    ],
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
        