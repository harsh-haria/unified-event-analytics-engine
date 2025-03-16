const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const mainRoute = require("./routes/main");

const app = express();

dotenv.config();

app.use(cors({
  origin: "*",
  methods: ['GET', 'POST']
}));

app.use("/api", mainRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});