const crypto = require('crypto');

const DBPool = require('../services/database');

function GenerateApiKey(appId) {
    try {
        // Generate a secure random token
        const expirationDays = +process.env.API_EXPIRATION_DAYS || 30;
        const apiKeyPlain = crypto.randomBytes(32).toString('hex');

        const fullApiKey = `api_${appId}_${apiKeyPlain}`;

        const hashedKey = crypto.createHash('sha256').update(fullApiKey).digest('hex');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);

        // convert expiresAt the way mysql stores dateTime
        // YYYY-MM-DD HH:MM:SS
        const expiresAtMysql = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

        return {
            key: hashedKey,
            expiry: expiresAtMysql
        };
    } catch (error) {
        console.error('API key creation error:', error);
        throw new Error('Failed to create API key');
    }
}

exports.ResourceCheck = async (userId, appId = null, apiKey = null) => {
    // check if the user has access to the app
    if (!userId && (!appId || !apiKey)) {
        return false;
    }
    if (appId) {
        const [appRows] = await DBPool.execute('SELECT app_id FROM apps WHERE user_id = ? AND app_id = ?', [userId, appId]);
        if (appRows.length && !apiKey) {
            return true;
        }
    }
    if (apiKey) {
        const [appRows] = await DBPool.execute('SELECT app_id FROM api_keys WHERE api_key = ?', [apiKey]);
        if (appRows.length) {
            let appId = appRows[0].app_id;
            const [userRows] = await DBPool.execute('SELECT app_id FROM apps WHERE user_id = ? AND app_id = ?', [userId, appId]);
            if (userRows.length) {
                return true;
            }
        }
    }
    return false;
}

exports.GenerateApiKey = async (appId) => {
    const { key, expiry } = GenerateApiKey(appId);
    await DBPool.execute('INSERT INTO api_keys(app_id, api_key, expiry, active) VALUES (?, ?, ?, 1)', [appId, key, expiry]);
    return {
        key, expiry
    }
}

exports.GetApiKeysForAppId = async (appId) => {
    const [rows] = await DBPool.execute('SELECT api_key, expiry FROM api_keys WHERE app_id = ? AND active = 1 AND expiry >= NOW()', [appId]);
    const keyArray = rows.map(item => {
        let expiry = item.expiry;
        return { key: item.api_key, expiry: expiry.toISOString().slice(0, 19).replace('T', ' ') }
    });
    return keyArray;
}

exports.RevokeApiKey = async (apiKey) => {
    await DBPool.execute('UPDATE api_keys SET active = 0 WHERE api_key = ?', [apiKey]);
    return;
}