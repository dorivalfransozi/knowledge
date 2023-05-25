const config = require('../knexfile');
const knex = require('knex')(config);

knex.migrate.latest([config]); // runs the migrations

module.exports = knex;