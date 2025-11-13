const express = require("express");
const cors = require("cors");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running fine");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0rghqsk.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("jobs-db");
    const jobsCollection = db.collection("jobs");
    const acceptedCollection = db.collection("accepted-tasks");

    await client.connect();

    // -----GET-----
    //all jobs
    app.get("/allJobs", async (req, res) => {
      const result = await jobsCollection
        .find()
        .sort({ postedDate: -1 })
        .toArray();
      res.send(result);
    });
    // single job
    app.get("/alljobs/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await jobsCollection.findOne({ _id: objectId });
      res.send(result);
    });
    // my added jobs
    app.get("/myAddedJobs", async (req, res) => {
      const email = req.query.email;
      const result = await jobsCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    //---- POST----
    // add a job
    app.post("/allJobs", async (req, res) => {
      const data = req.body;
      const result = await jobsCollection.insertOne(data);
      res.send(result);
    });
    // accepted task
    app.post("/my-accepted-tasks", async (req, res) => {
      const data = req.body;
      if (data.postedBy === data.accepted_by) {
        return res.send({ message: "You can't accept your own job." });
      }
      const result = await acceptedCollection.insertOne(data);
      res.send(result);
    });

    app.get("/my-accepted-tasks", async (req, res) => {
      const email = req.query.email;
      const result = await acceptedCollection
        .find({ accepted_by: email })
        .toArray();
      res.send(result);
    });
    app.delete("/my-accepted-tasks/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: id };
      const result = await acceptedCollection.deleteOne(filter);
      res.send(result);
    });

    //---- PUT----
    // update a job
    app.put("/alljobs/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const result = await jobsCollection.updateOne(filter, update);
      res.send(result);
    });

    //---- DELETE----
    // delete a job
    app.delete("/alljobs/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const result = await jobsCollection.deleteOne(filter);

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`Server is running on port: ${port}`);
});
