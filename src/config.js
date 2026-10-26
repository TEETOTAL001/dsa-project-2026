// src/config.js
export const config = {
    port: process.env.PORT || 3000,
    dbPath: process.env.DB_PATH || 'data/ticketing.db'
};
