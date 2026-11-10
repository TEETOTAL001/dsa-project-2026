// database.js
import fs from 'node:fs';
import path from 'node:path';
import { db, establishDatabasePragmas } from './src/db/connection.js';

// Re-export the connection pool instance directly for legacy script bindings
export { db };

export function initializeDatabaseSchema() {
    // 1. Establish strict foreign keys and activate Write-Ahead Logging (WAL)
    establishDatabasePragmas();

    // 2. Natively read the standalone text schema file blueprint
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const sqlQueries = fs.readFileSync(schemaPath, 'utf8');

    // 3. Execute the schema tables template straight onto your SQLite engine instance
    db.exec(sqlQueries);
    console.log("Relational tables schema structural mapping completed perfectly! ✅");
}
