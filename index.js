require("dotenv").config();
const fs = require("fs");
const path = require("path")
const { Pool } = require("pg");
const { logJob } = require("./lib/log");
const jobs = "./jobs";
const args = process.argv.slice(2);

console.log("ETL party getting started!\n\r==========================");

// DB connection
console.log("Filling the pool...");
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});


// the loop
(async () => {
  const client = await pool.connect();
  const files = await fs.promises.readdir(jobs);

  for (const file of files.filter(el => el.indexOf(".sql") !== -1)) {
    // if arg passed only execute that job
    if (args.length > 0 && args.indexOf(file) === -1) continue

    console.log(`Executing ${file}...`)
    const sql = await fs.promises.readFile(path.join(jobs, file));

    await client.query(sql.toString())
      .then(async res=> {
        await logJob(file, client)
      })
      .catch(async e => {
        await logJob(file, client, e.message || e)
      })
  }

  await client.release();
  await pool.end();
})()
