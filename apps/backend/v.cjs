require("dotenv").config();
const mysql = require("mysql2/promise");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.OLD_DB_HOST,
    port: +process.env.OLD_DB_PORT,
    user: process.env.OLD_DB_USER,
    password: process.env.OLD_DB_PASSWORD,
    database: process.env.OLD_DB_NAME,
    connectTimeout: 30000,
  });
  const [[r]] = await c.query(
    `SELECT COUNT(*) total, SUM(CHAR_LENGTH(COALESCE(phone,''))>15) phone_over, SUM(CHAR_LENGTH(COALESCE(contactPersonPhone,''))>15) contact_over, MAX(CHAR_LENGTH(COALESCE(phone,''))) max_phone FROM procurementvendordetailmaintab`,
  );
  console.log(JSON.stringify(r));
  await c.end();
})().catch((e) => console.log("ERR", e.message));
