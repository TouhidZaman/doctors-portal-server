const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//API  Endpoints
app.get("/", (req, res) => {
    res.send({
        success: true,
        message: "hello from doctors portal server",
        developedBy: "Muhammad Touhiduzzaman",
    });
});

//Listening to port
app.listen(port, () => {
    console.log("listening to port:", port);
});
