const express = require('express');
const passport = require('passport')

// for test
const AuthMiddlewares = require('../middlewares/auth');
const UserModel = require('../models/user');
const KeysModel = require('../models/keys');
const AppModel = require('../models/apps');

const router = express.Router();

router.get('/register', passport.authenticate('google', { scope: ['profile', 'email'] }));

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
    // Removed the early return statement that was preventing code execution
    if (!req.user) {
      return res.status(401).json({ message: 'No user data available' });
    }

    const googleId = req.user.id || req.user._json?.id;
    const checkUserExists = await UserModel.GetUserDetails(googleId);

    // if the user exists then we wont create a new app for the user
    if (!checkUserExists.length) {
      let userEmail = req.user.emails?.[0]?.value || req.user._json?.email;
      let firstName = req.user.name.givenName;
      let lastName = req.user.name.familyName;
      const userId = await UserModel.AddUser(googleId, userEmail, firstName, lastName);
      
      req.session.user_id = userId;

      // add new app for the user
      const app = await AppModel.AddApp(userId);
      
      if (app.status !== 200) {
        return res.status(500).json({ message: "Internal data conflict. Please try again later" });
      }
      const appId = app.app_id;
      
      // automatically generate a key for the new app
      await KeysModel.GenerateApiKey(appId);
      return res.status(200).json({ message: 'user account created!' });
    }

    req.session.user_id = checkUserExists[0].user_id;
    return res.status(200).json({ message: 'user authenticated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


/**
 * @openapi
 * '/auth/api-key':
 *  get:
 *     tags:
 *     - API Key Management
 *     summary: Retrieve API keys for an application
 *     description: Returns a list of API keys for a given app ID if the user owns the app.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *      - name: app_id
 *        in: query
 *        description: The ID of the application for which API keys are requested.
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *      200:
 *        description: Successfully retrieved API keys.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                keys:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      key:
 *                        type: string
 *                        description: The API key.
 *                      expiry:
 *                        type: string
 *                        format: date-time
 *                        description: Expiry date of the API key.
 *      403:
 *        description: Invalid App ID provided.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: Invalid App id provided
 *      500:
 *        description: Internal Server Error.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: Internal Server Error
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: header
 *       name: Cookie
*/
router.get('/api-key', AuthMiddlewares.ValidateUser, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const appId = req.query.app_id;
    const checkUserOwnsApp = await KeysModel.ResourceCheck(userId, appId);
    if (!checkUserOwnsApp) {
      return res.status(403).json({ error: 'Invalid App id provided' });
    }
    const apiKeys = await KeysModel.GetApiKeysForAppId(appId);
    return res.status(200).json({ 'keys': apiKeys });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @openapi
 * '/auth/revoke':
 *  post:
 *     tags:
 *     - API Key Management
 *     summary: Revoke an API key
 *     description: Revokes an API key if the user owns it.
 *     security:
 *       - cookieAuth: []
 *       - googleOAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               api-key:
 *                 type: string
 *                 description: The API key to be revoked.
 *     responses:
 *      200:
 *        description: Key revoked successfully.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: key revoked successfully
 *      403:
 *        description: Invalid API Key provided.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: Invalid API Key provided
 *      500:
 *        description: Internal Server Error.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: Internal Server Error
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: header
 *       name: Cookie
 */
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

/**
 * @openapi
 * '/auth/api-key':
 *  post:
 *     tags:
 *     - API Key Management
 *     summary: Generate a new API key
 *     description: Generates a new API key for the given application if the user owns the app.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               app_id:
 *                 type: string
 *                 description: The ID of the application for which the API key is generated.
 *     responses:
 *      200:
 *        description: New API Key Generated Successfully.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: New API Key Generated Successfully
 *                api-key:
 *                  type: string
 *                  description: The newly generated API key.
 *      403:
 *        description: Invalid App ID provided.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: Invalid App id provided
 *      500:
 *        description: Internal Server Error.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: Internal Server Error
*/
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
