const DBPool = require('../services/database');

exports.GetUserDetails = async (googelId) => {
    const [rows] = await DBPool.execute('SELECT * FROM users WHERE google_id = ?', [googelId]);
    return rows;
}

exports.AddUser = async (oauthId, userEmail) => {
    await DBPool.execute('INSERT INTO users(oauth_id, email) VALUES (?, ?)', [oauthId, userEmail]);
    const [result] = await DBPool.execute('SELECT id FROM users WHERE users.oauth_id = ?', [oauthId]);
    return result[0].id;
}