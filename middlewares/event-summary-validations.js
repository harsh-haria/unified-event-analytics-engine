const { query } = require("express-validator");

exports.validateEventSummaryInput = [
    query('event')
        .notEmpty().withMessage('Event is required')
        .isString().withMessage('Event must be a string')
        .isLength({ max: 255 }).withMessage('Event must be at max 255 characters long'),

    query('startDate')
        .optional()
        .isDate().withMessage('Start date must be a valid date string'),

    query('endDate')
        .optional()
        .isDate().withMessage('End date must be a valid date string'),

    query('app_id')
        .optional()
];