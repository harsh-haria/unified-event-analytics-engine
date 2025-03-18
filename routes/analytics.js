const express = require("express");
const { body, validationResult } = require("express-validator");

const EventModel = require('../models/event');

const { ValidateUser } = require('../middlewares/auth');

const { validateCollectInput } = require("../middlewares/collect-validations");
const { validateEventSummaryInput } = require("../middlewares/event-summary-validations");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Analytics route");
});

router.post('/collect', validateCollectInput, async (req, res) => {
  try {
    // validating the input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { event, url, referrer, device, ipAddress, timestamp, metadata, user_id, app_id } = req.body;

    // converting to db compatible timestamp
    const convertedTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');

    await EventModel.SaveEvent(event, url, referrer, device, ipAddress, convertedTimestamp, metadata, user_id, app_id);

    return res.status(200).json({ message: "Analytics data collected successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/event-summary', ValidateUser, validateEventSummaryInput, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.session.user_id;
    const { event, startDate, endDate, app_id } = req.body;

    const eventSummary = await EventModel.GetEventSummary(event, startDate, endDate, app_id, userId);

    return res.status(200).json({ eventSummary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/user-stats', ValidateUser, async (req, res) => {
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
