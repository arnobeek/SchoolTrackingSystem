const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dbDir = path.join(__dirname, '../../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'school.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');

module.exports = db;
