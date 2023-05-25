const app = require('express')();
const consing = require('consign');
const db = require('./config/db');
const mongoose = require('mongoose');

require('./config/mongodb');

app.db = db;
app.mongoose = mongoose;

consing()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validation.js')
    .then('./api') // todos os arq de api serao carregados... 
    .then('./schedule')
    .then('./config/routes.js')
    .into(app);

app.listen(3000, () => {
    console.log('Backend executando na porta 3000...');
})
