export enum RollingPeriod {
    MINUTE = 'minute',
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year'
}

/**
 * A user's options
 */
export default interface UserOptions {
    /**
     * Maximum number of queues allowed in a given rolling period
     */
    queueLimitTimeRestriction: {
        /**
         * Maximum number of queues allowed
         */
        maxQueueCount: number;
    
        /**
         * Interval value for the rolling period
         */
        intervalValue: number;
    
        /**
         * Unit of time for the rolling period
         */
        intervalUnit: RollingPeriod;
    }
}