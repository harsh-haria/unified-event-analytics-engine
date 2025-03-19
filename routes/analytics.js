const express = require("express");
const { body, validationResult } = require("express-validator");

const EventModel = require('../models/event');
const KeysModel = require('../models/keys');

const { ValidateApiKey, ValidateUser } = require('../middlewares/auth');
const RateLimiter = require('../middlewares/rate-limiter');

const { validateCollectInput } = require("../middlewares/collect-validations");
const { validateEventSummaryInput } = require("../middlewares/event-summary-validations");

const router = express.Router();

/**
 * @openapi
 * '/analytics/collect':
 *  post:
 *     tags:
 *     - Analytics
 *     summary: Collect analytics data
 *     description: Collects analytics data for events and stores them in the database.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: The event name.
 *               url:
 *                 type: string
 *                 description: The URL where the event occurred.
 *               referrer:
 *                 type: string
 *                 description: The referrer URL.
 *               device:
 *                 type: string
 *                 description: The device information.
 *               ipAddress:
 *                 type: string
 *                 description: The IP address of the user.
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of the event.
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the event.
 *               user_id:
 *                 type: string
 *                 description: The user ID associated with the event.
 *               app_id:
 *                 type: string
 *                 description: The application ID associated with the event.
 *     responses:
 *      200:
 *        description: Analytics data collected successfully.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Analytics data collected successfully
 *      400:
 *        description: Bad request due to validation errors.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *                  example: false
 *                errors:
 *                  type: array
 *                  items:
 *                    type: object
 *      500:
 *        description: Internal Server Error.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Internal server error
 * components:
 *   securitySchemes:
 *     apiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: X-API-KEY
 */
router.post('/collect', RateLimiter, ValidateApiKey, validateCollectInput, async (req, res) => {
  try {
    // validating the input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { event, url, referrer, device, ipAddress, timestamp, metadata, user_id } = req.body;

    const appId = req.session.app_id;

    // converting to db compatible timestamp
    const convertedTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');

    await EventModel.SaveEvent(event, url, referrer, device, ipAddress, convertedTimestamp, metadata, user_id, appId);

    return res.status(200).json({ message: "Analytics data collected successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @openapi
 * '/analytics/event-summary':
 *  get:
 *     tags:
 *     - Analytics
 *     summary: Retrieve event summary
 *     description: Fetches a summary of an event including unique users and device breakdown.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *      - name: event
 *        in: query
 *        description: The event name to summarize.
 *        required: true
 *        schema:
 *          type: string
 *      - name: startDate
 *        in: query
 *        description: Start date filter.
 *        required: false
 *        schema:
 *          type: string
 *          format: date-time
 *      - name: endDate
 *        in: query
 *        description: End date filter.
 *        required: false
 *        schema:
 *          type: string
 *          format: date-time
 *      - name: app_id
 *        in: query
 *        description: Application ID filter.
 *        required: false
 *        schema:
 *          type: string
 *     responses:
 *      200:
 *        description: Successfully retrieved event summary.
 *        content:
 *          application/json:
 *            example:
 *              event: "click"
 *              count: 10
 *              uniqueUsers: 1300
 *              deviceData:
 *                desktop: 5
 *                mobile: 5
 *      500:
 *        description: Internal Server Error.
 * 
 * components:
 *   securitySchemes:
 *     apiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: X-API-KEY
 */
router.get('/event-summary', RateLimiter, ValidateUser, validateEventSummaryInput, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.session.user_id;

    // startDate, endDate and app_id are optional
    const event = req.query.event;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const app_id = req.query.app_id;

    if (app_id) {
      const hasAccess = await KeysModel.ResourceCheck(userId, app_id);
      if (!hasAccess) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    const eventSummary = await EventModel.GetEventSummary(event, startDate, endDate, app_id, userId);

    return res.status(200).json({ eventSummary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @openapi
 * '/analytics/user-stats':
 *  get:
 *     tags:
 *     - Analytics
 *     summary: Retrieve user statistics
 *     description: Fetches event statistics for a given user, including total events, last device details, and IP address.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *      - name: userId
 *        in: query
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *      200:
 *        description: Successfully retrieved user statistics.
 *        content:
 *          application/json:
 *            example:
 *              userId: "12345"
 *              totalEvents: 10
 *              deviceDetails:
 *                browser: "Chrome"
 *                os: "Windows 10"
 *              ipAddress: "192.168.1.1"
 *      400:
 *        description: Bad Request - User ID is required.
 *        content:
 *          application/json:
 *            example:
 *              message: "User ID is required"
 *      500:
 *        description: Internal Server Error.
 */
router.get('/user-stats', RateLimiter, ValidateUser, async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userStats = await EventModel.GetUserStats(userId);

    return res.status(200).json({ userStats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
