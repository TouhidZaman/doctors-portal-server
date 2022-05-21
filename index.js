const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Verifying Token
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized access" });
    } else {
        const token = authHeader.split(" ")[1];

        // verify a token symmetric
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: "Forbidden access" });
            }
            // console.log("decoded", decoded);
            req.decoded = decoded;
            next();
        });
    }
};

//Mongodb Config
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gvs9c.mongodb.net/?retryWrites=true&w=majority`;
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
        const bookingCollection = client
            .db("doctors_portal_DB")
            .collection("bookings");
        const userCollection = client.db("doctors_portal_DB").collection("users");

        //Creating user and getting token for user
        app.put("/users/:email", async (req, res) => {
            const email = req.params?.email;
            const user = req.body;

            const filter = { email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };

            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            const accessToken = jwt.sign(
                { email },
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: "1d",
                }
            );
            // console.log(result, accessToken);
            res.send({ result, accessToken });
        });

        //Getting users
        app.get("/users", verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        //Creating user and getting token for user
        app.put("/users/admin/:email", verifyJWT, async (req, res) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({
                email: requester,
            });
            if (requesterAccount.role === "admin") {
                const email = req.params?.email;
                const filter = { email };
                const updateDoc = {
                    $set: {
                        role: "admin",
                    },
                };

                const result = await userCollection.updateOne(filter, updateDoc);

                res.send(result);
            } else {
                res.status(403).send({ message: "forbidden" });
            }
        });

        //Verify Admin
        app.get("/admin/:email", verifyJWT, async (req, res) => {
            const email = req.params?.email;
            const user = await userCollection.findOne({ email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
        });

        //Insert a booking appointment
        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            const query = {
                treatment: booking?.treatment,
                date: booking?.date,
                patient: booking?.patient,
            };

            const exists = await bookingCollection.findOne(query);

            if (exists) {
                return res.send({ success: false, booking: exists });
            } else {
                const result = await bookingCollection.insertOne(booking);
                res.send({ success: true, result });
            }
        });

        //Get Appointment bookings for specific  User
        app.get("/bookings", verifyJWT, async (req, res) => {
            const patient = req.query?.patient;
            const decodedUser = req.decoded?.email;
            if (decodedUser === patient) {
                const query = { patient };
                const bookings = await bookingCollection.find(query).toArray();
                return res.send(bookings);
            } else {
                return res.status(403).send({ message: "forbidden Access" });
            }
        });

        //Get Available Slots of Services
        app.get("/available", async (req, res) => {
            const date = req.query.date;
            const query = { date };
            const services = await serviceCollections.find().toArray();
            const bookings = await bookingCollection.find(query).toArray();

            //Warning: This is not proper approach use mongodb aggregation instead
            services.forEach((service) => {
                const serviceBookings = bookings.filter(
                    (booking) => booking.treatment === service.name
                );
                const bookedSlots = serviceBookings.map((sb) => sb.slot);
                // service.bookedSlots = bookedSlots;
                const available = service.slots.filter(
                    (slot) => !bookedSlots.includes(slot)
                );
                service.slots = available;
            });
            res.send(services);
        });

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
