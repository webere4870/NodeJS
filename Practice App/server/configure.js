const connect = require('connect')
const path = require('path')
const expressLayouts = require('express-ejs-layouts')

module.exports = (app) =>
{
    // Configuration code
    app.set('view-engine', 'ejs')
    app.set('views', __dirname + '/views')
    return app;
}