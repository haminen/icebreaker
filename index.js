//Tuodaan halutut moduulit

// express-palvelin jolla mahdollistetaan webbisivut
import express from "express";

//http-kutsut ja apihommat
import axios from "axios";

//mahdollistaa ip-tietojen näyttämisen ja tuomisen
import fetch from "node-fetch";

// tuodaan cookie-tietoja
import cookieParser from "cookie-parser";

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db', 'data.sqlite');

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

//muodostetaan serveri-oli ja määritellään portti missä servu käynnistellään kun käynnistellään
const app = express();
const PORT = process.env.PORT || 3000;

let activity = {};
let reqdata;
let ipdata;

//määrityksiä joita tarvitaan toimimiseen proxy-homma oli ipn näyttämiseen ja engine oli uuteen nodeversioon tms
app.set("trust proxy", true); //tunnistetaan käyttäjä oikean proxzytn takaa
app.set("view engine", "ejs");
app.set("views", "./views"); // oletuskansio templaateille

// 3. Use the public folder for static files. kuten kuvat ja tyylitiedostot
app.use(express.static("public"));

//uusi osio liittyen cookie dataan
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const nowInFinland = new Date().toLocaleString("fi-FI", {
  timeZone: "Europe/Helsinki"
});

console.log(nowInFinland);

// Yksinkertainen reitti
//app.get("/", (req, res) => {
//  res.send("Hello, Express!");
//});



/*
console.log('Käytettävä tietokanta:', dbPath);
const rows = await db.all(`
  SELECT
  *
  FROM visit
`);

console.log(rows);*/

app.get("/", async (req, res) => {

  try {
    // 1️⃣ Uniikit city+country -kombot
    const cityRows = await db.all(`
      SELECT DISTINCT
        json_extract(whois,'$.city') || ', ' || json_extract(whois,'$.country') AS citycountry
      FROM visit
      WHERE json_extract(whois,'$.city') IS NOT NULL
        AND json_extract(whois,'$.country') IS NOT NULL
    `);

    // Muutetaan pelkiksi arvoiksi arrayksi
    const ulocations = cityRows.map(r => r.citycountry.trim());
    // 2️⃣ Sivulataukset
    const { loads } = await db.get(`SELECT COUNT(*) AS loads FROM visit`);
    // 3️⃣ Uniikit kävijät (IP)
    const { uvisitors } = await db.get(`SELECT COUNT(DISTINCT ip) AS uvisitors FROM visit`);

    activity.loads = loads;
    activity.uvisitors = uvisitors;
    activity.ulocations = ulocations;
    //console.log ("loads: "+activity.loads+", uniqvisitors: "+activity.uvisitors+", uniqlocations: "+activity.ulocations);
    } catch (err){
      console.log(err.message);
    }

  try { //request-tiedot
      reqdata = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      cookies: req.cookies,
      query: req.query,
      ip: req.ip,
      body: req.body
    };
    } catch (err) {
      activity.requestdataString = `Error serializing req: ${err.message}`;
    }
    activity.requestdata = reqdata;
    activity.requestdataString = JSON.stringify(reqdata, null, 2); // <-- kaunis sisennys
  try {
    //vitsien haku
    const response = await axios.get("https://v2.jokeapi.dev/joke/Programming,Dark,Pun,Spooky?blacklistFlags=racist&format=txt");
    //console.log(response.data);
    activity.joke = response.data;
    } catch (err) {
      activity.joke =  "Error: " + err.message;
    }

  try {
    //ip-tiedot
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.connection.remoteAddress;
    const cleanIp = ip.replace("::ffff:", "");

    if (
      cleanIp.startsWith("127.") ||
      cleanIp.startsWith("10.") ||
      cleanIp.startsWith("192.168") ||
      cleanIp === "::1"
    ) {
      activity.city = "Unknown";
      activity.country = "Localhost";
    } else { //https://ipwho.is/194.86.38.39 -tsekkaa!
      const ipresp = await fetch(`https://ipwho.is/${cleanIp}`);
      ipdata = await ipresp.json();
      console.log(ipdata.type);
      activity.ipdataString = JSON.stringify(ipdata, null, 2); // <-- kaunis sisennys
      activity.city = ipdata.city;
      activity.country = ipdata.country;
      activity.lat = ipdata.latitude;
      activity.lon = ipdata.longitude;
    }
    activity.ip = cleanIp;
    } catch (err2){
      activity.ip = err2.message;
    }

  await db.run(
    `INSERT INTO visit (ip, request, whois) VALUES (?, ?, ?)`,
    [reqdata.ip, JSON.stringify(reqdata), JSON.stringify(ipdata)]
  );
  //console.log(activity);
  res.render("index.ejs", { content: activity });

});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});