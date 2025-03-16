const express = require("express");

const router = express.Router();

const authRoute = require("./auth");
const analyticsRoute = require("./analytics");

router.get("/", (req, res) => {
  res.send("Server alive");
});

router.use("/auth", authRoute);

router.use("/analytics", analyticsRoute);

module.exports = router;
