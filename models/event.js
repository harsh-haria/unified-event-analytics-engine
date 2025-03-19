const DBPool = require('../services/database');

exports.GetUserDetails = async (googelId) => {
    const [rows] = await DBPool.execute('SELECT * FROM users WHERE oauth_id = ?', [googelId]);
    return rows;
}

exports.SaveEvent = async (event, url, referrer, device, ipAddress, timestamp, metadata, userId, appId) => {
    await DBPool.execute('INSERT INTO events (event, url, referrer, device, ip_address, timestamp, metadata, user_id, app_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [event, url, referrer, device, ipAddress, timestamp, metadata, userId, appId]);
    return;
}

exports.GetEventSummary = async (event, startDate, endDate, appId, userId) => {
    let uniqueUsers = `SELECT COUNT(DISTINCT user_id) as uniqueUsers FROM events WHERE event = ?`;
    let uniqueUsersParams = [event];
    if (startDate) {
        uniqueUsers += ' AND timestamp >= ?';
        uniqueUsersParams.push(startDate);
    }
    if (endDate) {
        uniqueUsers += ' AND timestamp <= ?';
        uniqueUsersParams.push(endDate);
    }
    if (appId) {
        uniqueUsers += ' AND app_id = ?';
        uniqueUsersParams.push(appId);
    }
    else {
        uniqueUsers += ' AND app_id IN (SELECT app_id FROM apps WHERE user_id = ?)';
        uniqueUsersParams.push(userId);
    }
    const [uniqueUsersRows] = await DBPool.execute(uniqueUsers, uniqueUsersParams);

    let query = 'SELECT COUNT(*) as count, device FROM events WHERE event = ?';
    let queryParams = [event];

    if (startDate && endDate) {
        query += ' AND timestamp >= ?';
        queryParams.push(startDate);
    }
    if (endDate) {
        query += ' AND timestamp <= ?';
        queryParams.push(endDate);
    }

    if (appId) {
        query += ' AND app_id = ?';
        queryParams.push(appId);
    }
    else {
        query += ' AND app_id IN (SELECT app_id FROM apps WHERE user_id = ?)';
        queryParams.push(userId);
    }
    query += ' GROUP BY device';
    const [rows] = await DBPool.execute(query, queryParams);

    let totalEventCount = 0;

    let deviceData = {};
    rows.forEach(row => {
        totalEventCount += row.count;
        deviceData[row.device] = row.count;
    });

    return {
        event: event,
        count: totalEventCount,
        uniqueUsers: uniqueUsersRows[0].uniqueUsers,
        deviceData: deviceData
    }
};

exports.GetUserStats = async (userId) => {
    const [userCountData] = await DBPool.execute('SELECT COUNT(*) AS eventCount FROM events WHERE user_id = ?', [userId]);
    if (userCountData[0]['eventCount'] === 0) {
        return {
            userId,
            totalEvents: 0,
            deviceDetails: {},
            ipAddress: ""
        }
    }
    const [lastUserEntry] = await DBPool.execute('SELECT * FROM events WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1', [userId]);
    let deviceDetails = {};
    try {
        deviceDetails = JSON.parse(lastUserEntry[0].metadata);
    } catch (error) {
        deviceDetails = lastUserEntry[0].metadata;
    }
    let ipAddress = lastUserEntry[0].ip_address;
    return {
        userId,
        totalEvents: userCountData[0]['eventCount'],
        deviceDetails,
        ipAddress
    }
}