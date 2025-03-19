const { ResourceCheck, GetApiKeyDetails } = require('../models/keys');

exports.ValidateUser = (req, res, next) => {
    req.user ? next() : res.status(401).json({ message: "Unauthorized" });
}

exports.ValidateApiKey = async (req, res, next) => {
    let apiKey = req.header("X-API-KEY");
    if (!apiKey) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const apiKeyDetailsArray = await GetApiKeyDetails(apiKey, true);
    if (!apiKeyDetailsArray.length) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    const apiKeyDetails = apiKeyDetailsArray[0];

    req.session.app_id = apiKeyDetails.app_id;
    req.session.user_id = apiKeyDetails.user_id;

    next();
}