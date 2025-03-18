const DBPool = require('../services/database');

exports.AddApp = async (userId, appName = 'Default App 1') => {
    // check if app with same name already exists if not only then insert new app
    const [rows] = await DBPool.execute('SELECT * FROM apps WHERE user_id = ? AND app_name = ?', [userId, appName]);

    if (!rows.length) {
        const [result] = await DBPool.execute('INSERT INTO apps(user_id, app_name) VALUES (?, ?)', [userId, appName]);
        const [app] = await DBPool.execute('SELECT * FROM apps WHERE user_id = ? AND app_name = ?', [userId, appName]);
        return {
            status: 200,
            message: 'App created successfully',
            app_id: app[0].app_id
        }
    }
    else {
        return {
            status: 409,
            message: 'App with the same name already exists',
            app_id: null
        }
    }
};