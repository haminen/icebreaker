//Tuodaan halutut moduulit

// express-palvelin jolla mahdollistetaan webbisivut
import express from "express";

//http-kutsut ja apihommat
import axios from "axios";

//muodostetaan serveri-oli ja määritellään portti missä servu käynnistellään kun käynnistellään
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Use the public folder for static files. kuten kuvat ja tyylitiedostot
app.use(express.static("public"));

// Yksinkertainen reitti
//app.get("/", (req, res) => {
//  res.send("Hello, Express!");
//});

app.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://v2.jokeapi.dev/joke/Programming,Dark,Pun,Spooky?blacklistFlags=racist&format=txt");
    //console.log(response.data);
    const activity = response.data;

    // lähetetään data index.ejs:ään
    res.render("index.ejs", { content: activity });
  } catch (err) {
    res.render("index.ejs", { content: "Error: " + err.message });
  }
});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});