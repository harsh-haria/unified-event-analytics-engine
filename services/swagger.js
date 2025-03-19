const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Unified Events Analytics Engine',
            description: "API endpoints for Unified Events Analytics Engine",
            contact: {
                name: "Harsh Haria",
                email: "harsh.nh2412@gmail.com",
                url: "https://github.com/harsh-haria"
            },
            version: '1.0.0',
        },
        servers: [
            {
                url: "http://localhost:3090/api/",
                description: "Local Server"
            },
        ]
    },
    // looks for configuration in specified directories
    apis: [
        path.join(__dirname, '../routes/*.js')
    ],
}
const swaggerSpec = swaggerJsdoc(options)
exports.swaggerDocs = (app) => {
    // Swagger Page
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    // Documentation in JSON format
    app.get('/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerSpec)
    });
}