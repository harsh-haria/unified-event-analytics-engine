const DBPool = require('../services/database');

exports.GetUserDetails = async (googelId) => {
    const [rows] = await DBPool.execute('SELECT * FROM users WHERE oauth_id = ?', [googelId]);
    return rows;
}

exports.AddUser = async (oauthId, userEmail, firstName, lastName) => {
    await DBPool.execute('INSERT INTO users(oauth_id, email, first_name, last_name) VALUES (?, ?, ?, ?)', [oauthId, userEmail, firstName, lastName]);
    const [result] = await DBPool.execute('SELECT user_id FROM users WHERE users.oauth_id = ?', [oauthId]);
    return result[0].user_id;
}