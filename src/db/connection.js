// src/db/connection.js
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(path.join(dataDir, 'ticketing.db'));

export function establishDatabasePragmas() {
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    console.log("Database engine constraints and WAL mode activated successfully! ⚡");
}
