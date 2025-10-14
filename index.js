//Tuodaan halutut moduulit

// express-palvelin jolla mahdollistetaan webbisivut
import express from "express";

//http-kutsut ja apihommat
import axios from "axios";

//mahdollistaa ip-tietojen näyttämisen ja tuomisen
import fetch from "node-fetch";

// tuodaan cookie-tietoja
import cookieParser from "cookie-parser";

//muodostetaan serveri-oli ja määritellään portti missä servu käynnistellään kun käynnistellään
const app = express();
const PORT = process.env.PORT || 3000;

let activity = {};

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

app.get("/", async (req, res) => {

  try { //request-tiedot
    const reqdata = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      cookies: req.cookies,
      query: req.query,
      ip: req.ip,
      body: req.body
    };
    activity.requestdataString = JSON.stringify(reqdata, null, 2);
    //console.log(activity.requestdata);
  } catch (err) {
    activity.requestdataString = `Error serializing req: ${err.message}`;
  }

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
      //const ipresp = await fetch(`https://ipapi.co/${cleanIp}/json/`);
      const ipresp = await fetch(`https://ipwho.is/${cleanIp}`);
      const ipdata = await ipresp.json();
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
  res.render("index.ejs", { content: activity });

});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});