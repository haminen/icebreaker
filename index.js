//Tuodaan halutut moduulit

// express-palvelin jolla mahdollistetaan webbisivut
import express from "express";

//http-kutsut ja apihommat
import axios from "axios";

//mahdollistaa ip-tietojen näyttämisen ja tuomisen
import fetch from "node-fetch";

//muodostetaan serveri-oli ja määritellään portti missä servu käynnistellään kun käynnistellään
const app = express();
const PORT = process.env.PORT || 3000;

let activity = {};

//määrityksiä joita tarvitaan toimimiseen proxy-homma oli ipn näyttämiseen ja engine oli uuteen nodeversioon tms
app.set("trust proxy", true);
app.set("view engine", "ejs");
app.set("views", "./views"); // oletuskansio templaateille

// 3. Use the public folder for static files. kuten kuvat ja tyylitiedostot
app.use(express.static("public"));

// Yksinkertainen reitti
//app.get("/", (req, res) => {
//  res.send("Hello, Express!");
//});

app.get("/", async (req, res) => {
  try {
    //vitsien haku
    const response = await axios.get("https://v2.jokeapi.dev/joke/Programming,Dark,Pun,Spooky?blacklistFlags=racist&format=txt");
    //console.log(response.data);
    activity.joke = response.data;

    //ip-tiedot
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0];
    const cleanIp = ip.replace("::ffff:", "");
    const ipresp = await fetch(`https://ipapi.co/${cleanIp}/json/`);
    const ipdata = await ipresp.json();
    //console.log("Vierailijan sijainti:", ipdata);
    activity.city = ipdata.city;
    activity.country = ipdata.country_name;
    activity.ip = cleanIp;

    // lähetetään data index.ejs:ään
    //console.log(activity);
    res.render("index.ejs", { content: activity });
  } catch (err) {
    res.render("index.ejs", { content: "Error: " + err.message });
  }
});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});