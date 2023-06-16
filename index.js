const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const app = express();
const port = process.env.PORT || 5000;

//midleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kfi6tak.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersColletion = client.db("englishCenter").collection("users");
    const instructorColletion = client.db("englishCenter").collection("Instructor");
    const addedClassColletion = client.db("englishCenter").collection("addedClasses");
    const classColletion = client.db("englishCenter").collection("classes");
    const selectedClassColletion = client.db("englishCenter").collection("selectedClasses");

    // app.post("/users", async (req, res) => {
    //   const users = req.body;
    //   console.log(users)
    //   const query = { email: users.email };
    //   const exsitingUser = usersColletion.findOne(query);
    //   console.log("existing user:",exsitingUser)
    //   if (exsitingUser) {
    //     return res.send({ message: "User already exist" });
    //   }
    //   const result = await usersColletion.insertOne(users);
    //   res.send(result);
    // });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = user.email;
      const existUser = await usersColletion.findOne({ email: email });
      if (existUser) {
        return res.json("User Exist");
      } else {
        const result = await usersColletion.insertOne(user);
        res.send(result);
      }
    });

    app.get("/users", async (req, res) => {
      const users = usersColletion.find()
      const result = await users.toArray()
      res.send(result)
    });


    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      if (!email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersColletion.findOne(query);
      const result = { admin: user?.role == "admin" };
      res.send(result);
    });

    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      console.log(paymentIntent.client_secret)
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    app.get("/users/instructor/:email", async (req, res) => {
      const email = req.params.email;
      if (!email) {
        res.send({ instructor: false });
      }
      const query = { email: email };
      const user = await usersColletion.findOne(query);
      const result = { instructor: user?.role == "instructor" };
      res.send(result);
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersColletion.updateOne(filter, updateDoc);
      res.send(result);

    })
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await usersColletion.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.post("/selectedClasses", async (req, res) => {
      const selectedClass = req.body;
      const result = await selectedClassColletion.insertOne(selectedClass);
      res.send(result);
    });

    app.post("/addedClass", async (req, res) => {
      const newClass = req.body;
      console.log(newClass)
      const result = await addedClassColletion.insertOne(newClass);
      res.send(result);
    });

    app.get("/addedClass", async (req, res) => {
      const email =  req.query.email;
      console.log(email)
      const query = { instructorEmail:email};
      const result = await addedClassColletion.find(query).toArray();
      res.send(result);
    });

    app.get("/addedClass/admin", async (req, res) => {
      const addedClass = addedClassColletion.find()
      const result = await addedClass.toArray();
      res.send(result);
    });

    app.delete("/deleteSelectedClasses/:id", async(res, req)=>{
      const id = req.params.id;
      console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await addedClassColletion.deleteOne(query)
      res.send(result)
    })

    app.patch("/addedClass/admin/:id", async (req, res) => {
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      console.log(filter)
      const updateDoc = {
        $set: {
          status: 'approved'
        },
      };
      const result = addedClassColletion.updateOne(filter,updateDoc)
      res.send(result);
    });

    app.patch("/addedClass/admin/:id", async (req, res) => {
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      console.log(filter)
      const updateDoc = {
        $set: {
          status: 'denied'
        },
      };
      const result = addedClassColletion.updateOne(filter,updateDoc)
      res.send(result);
    });

    app.get("/selectedClasses", async (req, res) => {
      const email =  req.query.email;
      console.log(email)
      const query = { email: email };
      const result = await selectedClassColletion.find(query).toArray();
      res.send(result);
    });

    app.get("/instructor", async (req, res) => {
      const instructor = instructorColletion.find();
      const result = await instructor.toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = usersColletion.find();
      const result = await users.toArray();
      res.send(result);
    });
    app.get("/classes", async (req, res) => {
      const classes = classColletion.find();
      const result = await classes.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
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

app.get("/", (req, res) => {
  res.send("English center is running");
});

app.listen(port, () => {
  console.log(`English center API is running on port : ${port}`);
});
