const express = require("express");

const app = express();
const cors = require("cors");
app.use(express.urlencoded({ extended: true }));


const path = require('path');
require('dotenv').config({
  override: true,
  path: path.join(__dirname, '.env'),
});

const { Pool , Client} = require('pg');

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

(async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT current_user');
    const currentUser = rows[0]['current_user'];
    console.log(currentUser);
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    client.release();
  }
})();

const port = process.env.port || 5000;

var corsOptions = {
  origin: "*",
 
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ussef application." });
});

app.post('/api/insertData', async (req, res) => {
  try {
    const { deviceid, lat , lng  , createddate} = req.body; 

    const insertQuery = 'INSERT INTO public.nfc (devicename, lat , lng , createddate) VALUES ($1, $2, $3 , $4)';
    const values = [deviceid, lat, lng , createddate];

    await pool.query(insertQuery, values);

    res.status(200).json({ success: true, message: 'Data inserted successfully!' });
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(404).json({ success: false, message: 'Internal server error' });
  }
});
app.post('/api/inertvention', async (req, res) => {
  try {
    const { deviceid, lat , lng  , createddate} = req.body; 

    const insertQuery = 'INSERT INTO public.intervention (devicename, lat , lng , createdate) VALUES ($1, $2, $3 , $4)';
    const values = [deviceid, lat, lng , createddate];

    await pool.query(insertQuery, values);

    res.status(200).json({ success: true, message: 'Data inserted successfully!' });
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(404).json({ success: false, message: 'Internal server error' });
  }
});



app.get('/api/selectData', async (req, res) => {
  try {
    const selectQuery = 'SELECT * FROM public.fleet_vehicle_fleet_vehicle_can_rel';
    const result = await pool.query(selectQuery);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error executing select query:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});





app.listen(port, () => {
    console.log(`Server is running in Port :${port}`);
  });
  