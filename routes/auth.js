const express = require("express");
const passport = require("passport")

// for test
// const AuthMiddlewares = require('../middlewares/auth');

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/authError",
    successRedirect: "/api/auth/authSuccess"
  })
);

router.get('/authError', (req, res) => {
  res.sendStatus(401);
});

router.get('/authSuccess', (req, res) => {
  console.log("User is:", req.user);
  res.sendStatus(200);
});

router.get('/logout', async (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy();
    res.sendStatus(200);
  });
});

// for test
// router.get(
//   '/api-key',
//   AuthMiddlewares.ValidateUser,
//   (req, res) => {
//     res.status(200).json({ "api-key": "testtesttesttest" });
//   }
// );

module.exports = router;
