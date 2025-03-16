const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Analytics route");
});

module.exports = router;
