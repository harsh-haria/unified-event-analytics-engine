const { body } = require("express-validator");

exports.validateCollectInput = [
    body('event')
        .notEmpty().withMessage('Event is required')
        .isString().withMessage('Event must be a string')
        .isLength({ max: 255 }).withMessage('Event must be at max 255 characters long'),

    body('url')
        .notEmpty().withMessage('URL is required')
        .isURL().withMessage('URL must be a valid URL')
        .isLength({ max: 60000 }).withMessage('URL must be at max 60,000 characters long'),

    body('referrer')
        .optional()
        .isURL().withMessage('Referrer must be a valid URL')
        .isLength({ max: 60000 }).withMessage('Referrer must be at max 60,000 characters long'),

    body('device')
        .notEmpty().withMessage('Device is required')
        .isString().withMessage('Device must be a string')
        .isLength({ max: 255 }).withMessage('Device must be at max 255 characters long'),

    body('ipAddress')
        .notEmpty().withMessage('IP Address is required')
        .isString().withMessage('IP Address must be a string')
        .isLength({ max: 40 }).withMessage('IP Address must be at max 40 characters long'),

    body('timestamp')
        .notEmpty().withMessage('Timestamp is required')
        .isISO8601().withMessage('Timestamp must be a valid ISO 8601 date string'),

    body('metadata')
        .notEmpty().withMessage('Metadata is required')
        .isObject().withMessage('Metadata must be an object')
        .isLength({ max: 60000 }).withMessage('Metadata must be at max 60,000 characters long'),

    body('metadata.browser')
        .optional()
        .isString().withMessage('Browser must be a string'),

    body('metadata.os')
        .optional()
        .isString().withMessage('OS must be a string'),

    body('metadata.screenSize')
        .optional()
        .isString().withMessage('Screen size must be a string'),

    body('user_id')
        .notEmpty().withMessage('User ID is required'),
];