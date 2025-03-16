const express = require('express');
const passport = require('passport')

// for test
const AuthMiddlewares = require('../middlewares/auth');
const UserModel = require('../models/user');
const KeysModel = require('../models/keys');
const AppModel = require('../models/apps');

const router = express.Router();

router.post('/register', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/authError',
    successRedirect: '/api/auth/authSuccess'
  })
);

router.get('/authError', (req, res) => {
  return res.sendStatus(401);
});

router.get('/logout', async (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ message: 'There was an error while logging you out!' })
    }
    req.session.destroy();
    return res.sendStatus(200);
  });
});

router.get('/authSuccess', async (req, res) => {
  try {
    const checkUserExists = await UserModel.GetUserDetails();
    if (!checkUserExists?.google_id) {
      let userGoogleId = req.user['_json'].id;
      let userEmail = req.user['_json'].email;
      const userId = await UserModel.AddUser(userGoogleId, userEmail);
      req.session.user_id = userId;
      const app = await AppModel.AddApp(userId);
      if (app.status !== 200) {
        return res.status(500).json({ message: "Internal data conflict. Please try again later" });
      }
      const appId = app.app_id;
      await KeysModel.GenerateApiKey(appId);
      return res.status(200).json({ message: 'user account created!' });
    }
    return res.status(200).json({ message: 'user authenticated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api-key', AuthMiddlewares.ValidateUser, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const appId = req.query.app_id;
    const checkUserOwnsApp = await KeysModel.ResourceCheck(userId, appId);
    if (!checkUserOwnsApp) {
      return res.status(403).json({ error: 'Invalid App id provided' });
    }
    const apiKeys = await KeysModel.GetApiKeysForAppId(appId);
    return res.status(200).json({ 'keys': apiKeys.keys });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/revoke', AuthMiddlewares.ValidateUser, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const apiKey = req.body['api-key'];
    const checkUserOwnsKey = await KeysModel.ResourceCheck(userId, null, apiKey);
    if (!checkUserOwnsKey) {
      return res.status(403).json({ error: 'Invalid API Key provided' });
    }
    await KeysModel.RevokeApiKey(apiKey);
    return res.status(200).json({ message: 'key revoked successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/api-key', AuthMiddlewares.ValidateUser, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const appId = req.body['app_id'];
    const checkUserOwnsApp = await KeysModel.ResourceCheck(userId, appId);
    if (!checkUserOwnsApp) {
      return res.status(403).json({ error: 'Invalid App id provided' });
    }
    const apiKey = await KeysModel.GenerateApiKey(appId);
    return res.status(200).json({ message: "New API Key Generated Successfully", 'api-key': apiKey });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// for test
// router.get(
//   '/api-key',
//   AuthMiddlewares.ValidateUser,
//   (req, res) => {
//     res.status(200).json({ 'api-key': 'testtesttesttest' });
//   }
// );

module.exports = router;
