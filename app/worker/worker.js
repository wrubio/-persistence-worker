const CronJob = require('cron').CronJob;
const { Pool } = require("pg");
const Redis = require("ioredis");

// ================================================================
// Start local REDIS connection
const REDIS_PORT = process.env.PORT || 6379;
const redis = new Redis({
  port: REDIS_PORT,
  host: "127.0.0.1",
});
// ================================================================
// Create pool conection to Cloud DB
const pool = new Pool({
  host: 'endpoint cloud db',
  user: 'postgres',
  password: 'postgres admin password',
  port: 'db port connection',
  database: 'db name',
});

// ================================================================
// Migrate the redis data to cloud DB
function migrateKeyToMySQL(key) {
  return new Promise(async (res, rej) => {
    const getValueKey = await redis.get(`${key}`);
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const queryString = `INSERT INTO sensors( sensor_name, sensor_values, created_on) VALUES('rbpi_agent_001','${getValueKey}', '${date}' )`;
    
    (async () => {
      const client = await pool.connect();

      try {
        const queryResult = await client.query(queryString);
        await redis.del(`${key}`);
        res(queryResult);
      } finally {
        client.release();
      }
    })().catch(err => {
      rej(err);
    });
  });
}

// ================================================================
// Set job to migrate data to cloud db every 30s
const job = new CronJob('*/30 * * * * *', async() => {
  const stream = redis.scanStream({ match: 'sensor_data:*', count: 10 });

  stream.on('data', function (resultKeys) {
    stream.pause();
  
    Promise.all(resultKeys.map(key => migrateKeyToMySQL(key))).then((result) => {
      // console.log(result);
      stream.resume();
    }, error => {
      console.log(error);
    });
  });
  
  stream.on('end', function(){
    console.log('terminó');
  });
  
  stream.on('error', function(err){
    console.log("error", err);
  });
}, null, true, 'America/Bogota');

job.start();
