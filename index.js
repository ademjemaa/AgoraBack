import "dotenv/config";

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { createRequire } from "module";
import cors from "cors";

import userRoutes from "./routes/users.js";
import icoRoutes from "./routes/ico.js";
import accRoutes from "./routes/account.js";
import upgradeRoutes from "./routes/upgrade.js";
import dashboardRoutes from "./routes/dashboard.js";

const require = createRequire(import.meta.url);
const { MongoClient } = require('mongodb');


const app = express();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/users", userRoutes);
app.use("/account", accRoutes);
app.use("/ico", icoRoutes);
app.use("/upgrade", upgradeRoutes);
app.use("/dashboard", dashboardRoutes);

const CONNECTION_URL =
  process.env.DBURL ||
  "mongodb+srv://Daraos:xSJbu0kArQHSApj5@cluster0.tgecm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const PORT = process.env.PORT;

export var client = await mongoose
  .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    app.listen(PORT, () => console.log(`SERVER RUNNING ON PORT: ${PORT}`))
  )
  .catch(() => console.log("launch error, probably ip address on mongo db"));

