const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "empire.sqlite");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS network_servers (
 guild_id TEXT PRIMARY KEY, guild_name TEXT NOT NULL, description TEXT DEFAULT '',
 invite_url TEXT DEFAULT '', added_by TEXT NOT NULL, added_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS warnings (
 id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
 moderator_id TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL
);`);
const q = {
 list: db.prepare("SELECT * FROM network_servers ORDER BY guild_name COLLATE NOCASE"),
 get: db.prepare("SELECT * FROM network_servers WHERE guild_id = ?"),
 add: db.prepare(`INSERT INTO network_servers (guild_id,guild_name,description,invite_url,added_by,added_at)
 VALUES (@guild_id,@guild_name,@description,@invite_url,@added_by,@added_at)
 ON CONFLICT(guild_id) DO UPDATE SET guild_name=excluded.guild_name,description=excluded.description,invite_url=excluded.invite_url`),
 remove: db.prepare("DELETE FROM network_servers WHERE guild_id = ?"),
 warn: db.prepare("INSERT INTO warnings (guild_id,user_id,moderator_id,reason,created_at) VALUES (?,?,?,?,?)"),
 warnings: db.prepare("SELECT * FROM warnings WHERE guild_id=? AND user_id=? ORDER BY id DESC")
};
module.exports = {
 listServers: () => q.list.all(),
 getServer: id => q.get.get(id),
 addServer: data => q.add.run(data),
 removeServer: id => q.remove.run(id),
 addWarning: (g,u,m,r) => q.warn.run(g,u,m,r,new Date().toISOString()),
 listWarnings: (g,u) => q.warnings.all(g,u)
};
