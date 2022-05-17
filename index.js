const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Mongodb Config
const uri =
   `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gvs9c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   serverApi: ServerApiVersion.v1,
});

// API Endpoints
async function run() {
   try {
      await client.connect();
      const serviceCollections = client
         .db("doctors_portal_DB")
         .collection("services");

      //Find All Services
      app.get("/services", async (req, res) => {
         const query = {};
         const cursor = serviceCollections.find(query);
         const services = await cursor.toArray();
         res.send(services);
      });
   } finally {
      //   await client.close();
   }
}
run().catch(console.dir);

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
