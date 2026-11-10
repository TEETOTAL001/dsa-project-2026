// src/db/connection.js
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// Establish a single, shared connection pool instance matching instructor specs
export const db = new DatabaseSync(path.join(process.cwd(), 'data', 'ticketing.db'));

export function establishDatabasePragmas() {
    // Enforce foreign key constraints strictly at the engine layer
    db.exec('PRAGMA foreign_keys = ON;');
    
    // Activate WAL (Write-Ahead Logging) mode to optimize concurrent read/write operations
    db.exec('PRAGMA journal_mode = WAL;');
    
    console.log("Database engine constraints and WAL mode activated successfully! ⚡");
}
