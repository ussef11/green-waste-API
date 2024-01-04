const express = require("express");

const app = express();
const cors = require("cors");
app.use(express.urlencoded({ extended: true }));

const path = require("path");
require("dotenv").config({
  override: true,
  path: path.join(__dirname, ".env"),
});

const { Pool, Client } = require("pg");

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
    const { rows } = await client.query("SELECT current_user");
    const currentUser = rows[0]["current_user"];
    console.log(currentUser);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    client.release();
  }
})();

const port = 5000;

var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ussef application." });
});

const getcode = async id => {
  const selectQuery = 'SELECT * FROM public."NFC"  where "CODETABLLETE" = $1  ';
  const values = [id];
  const result = await pool.query(selectQuery, values);
  return result;
};

// id SERIAL,
// deviceid INTEGER NOT NULL,
// devicetime TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
// lat DOUBLE PRECISION,
// lon DOUBLE PRECISION,

app.post("/api/insertData", async (req, res) => {
  try {
    const { deviceid, lat, lng, createddate, username, phone } = req.body;

    //const codedata = await getcode(deviceid)
    ////const  device =  codedata.rows[0].deviceid
    //console.log( "device id" , device)

    const insertQuery =
      "INSERT INTO public.dv (deviceid, devicetime  , lat , lon,username , phone) VALUES ($1, $2, $3 , $4  , $5 , $6)";
    const values = [deviceid, createddate, lat, lng, username, phone];

    await pool.query(insertQuery, values);

    res
      .status(200)
      .json({ success: true, message: "Data inserted successfully!" });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(404).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/inertvention", async (req, res) => {
  try {
    const { deviceid, lat, lng, createddate, username, phone } = req.body;

    // const codedata = await getcode(deviceid)
    // const  device =  codedata.rows[0].deviceid

    const nature = "appel";
    //console.log( "device id:" , device)

    const insertQuery =
      "INSERT INTO public.intervention (deviceid, devicetime  , lat , lon , nature , username , phone) VALUES ($1, $2, $3 , $4 ,$5 , $6 , $7)";
    const values = [deviceid, createddate, lat, lng, nature, username, phone];

    await pool.query(insertQuery, values);

    res
      .status(200)
      .json({ success: true, message: "Data inserted successfully!" });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(404).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/getbac", async (req, res) => {
  try {
    const { cid } = req.body;
    const insertQuery = `
                    SELECT 
                    bac.latitude,
                    bac.longitude,
                    bac.typeb,
                    "STR1"
                    FROM
                    public."CIRCUIT"
                    INNER JOIN public."CIRCUIT_DET2" ON (public."CIRCUIT"."IDCIRCUIT" = public."CIRCUIT_DET2".idcircuit)
                    INNER JOIN public.routes ON (public."CIRCUIT_DET2".id_cirdet = public.routes.ogc_fid),
                    public.bacs bac inner join public."PARAM" pb on ( bac.typeb  = pb."INTIT" )
                    where st_dwithin(public.routes.geom, st_setsrid(st_makepoint(bac.longitude, bac.latitude), 4326), 0.00015)
                    and  public."CIRCUIT"."IDCIRCUIT" = $1
                      `;
    const value = [cid];

    const result = await pool.query(insertQuery, value);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(404).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/getnearlypoint", async (req, res) => {
  try {
    const { cid  , lat , lng } = req.body;
    const insertQuery = `
        SELECT
        ST_Distance(routes.geom::geography, ST_SetSRID(ST_MakePoint( $1 , $2), 4326)::geography) as distance,
        circuits."NOM" as name,
        ST_X(ST_ClosestPoint(routes.geom, ST_SetSRID(ST_MakePoint(  $1 , $2), 4326))) AS longitude ,
        ST_Y(ST_ClosestPoint(routes.geom, ST_SetSRID(ST_MakePoint(  $1 , $2), 4326))) AS latitude 
        FROM
        public."CIRCUIT" as circuits
        INNER JOIN public."CIRCUIT_DET2" ON (circuits."IDCIRCUIT" = public."CIRCUIT_DET2".idcircuit)
        INNER JOIN public.routes as  routes ON (public."CIRCUIT_DET2".idroutes= routes.ogc_fid)
        WHERE  circuits."IDCIRCUIT" = $3
        ORDER BY
        ST_Distance(routes.geom::geography, ST_SetSRID(ST_MakePoint( $1 , $2), 4326)::geography)
        LIMIT 1;
                      `;
    const value = [lng , lat, cid];

    const result = await pool.query(insertQuery, value);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(404).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/circuitdata", async (req, res) => {
  try {
    const { deviceid , datej, cid} = req.body;
    const insertQuery = `
    select  
    p.deviceid as id ,
    p.idcircuit as circuitid,
    p.datej as datej,
    p.hdeb as hdeb,
    p.hfin as hfin,
    st_AsText(routes.geom) as geom,
    circuits."NOM" as name
    from  
    public."CIRCUIT" as circuits
    INNER JOIN public."CIRCUIT_DET2" ON (circuits."IDCIRCUIT" = public."CIRCUIT_DET2".idcircuit)
    INNER JOIN public.routes as  routes ON (public."CIRCUIT_DET2".idroutes= routes.ogc_fid) 
    inner join public.planning p on ( circuits."IDCIRCUIT" =  p.idcircuit) inner join public.devices devices  on( p.deviceid  = devices.id )  where 
    p.deviceid = $1 and  p.datej =  $2 and  p.idcircuit = $3
                      `;
    const value = [deviceid , datej, cid];

    const result = await pool.query(insertQuery, value);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(404).json({ success: false, message: "Internal server error" });
  }
});





// app.get("/api/selectData", async (req, res) => {
//   try {
//     const selectQuery =
//       "SELECT * FROM public.fleet_vehicle_fleet_vehicle_can_rel";
//     const result = await pool.query(selectQuery);
//     res.status(200).json({ success: true, data: result.rows });
//   } catch (err) {
//     console.error("Error executing select query:", err);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

app.listen(port, () => {
  console.log(`Server is running in Port :${port}`);
});
