import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";

import userRoutes from "./routes/users.js";
import accRoutes from "./routes/transfer.js";

const app = express();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/users", userRoutes);
app.use("/account", accRoutes);

const CONNECTION_URL = process.env.DBURL ||
  "mongodb+srv://Daraos:xSJbu0kArQHSApj5@cluster0.tgecm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const PORT = process.env.PORT || 5000;

mongoose
  .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    app.listen(PORT, () => console.log(`SERVER RUNNING ON PORT: ${PORT}`))
  )
  .catch(() => console.log("launch error, probably ip address on mongo db"));

//mongoose.set('useFindAndModify', false);
