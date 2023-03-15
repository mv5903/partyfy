const sql = require('mssql')

export const config = {
    user: 'matt',
    password: '',
    database: 'partyfy',
    server: 'home.mattvandenberg.com',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: false
    }
}

async function connect() {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Users`;
        console.log(result);
    } catch (err) {
        // ... error checks
        console.error(err);
    }
}

connect();