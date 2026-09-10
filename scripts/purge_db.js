const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const db = new DatabaseSync(dbPath);

db.exec(`
  DELETE FROM JobOffer WHERE id = 'remotive-2091045' OR title LIKE '%Service Desk%';
  DELETE FROM JobMatch WHERE jobOfferId NOT IN (SELECT id FROM JobOffer);
  DELETE FROM ApplicationTracker WHERE jobOfferId NOT IN (SELECT id FROM JobOffer);
`);

const remaining = db.prepare("SELECT id, title, company FROM JobOffer").all();
console.log("Remaining jobs count:", remaining.length);
console.log(JSON.stringify(remaining, null, 2));
