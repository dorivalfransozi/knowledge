const admin = require('./admin.js');

module.exports = app => {

    // ordem das rotas deve ser primeiro as mais especificas

    // as 3 unicas urls que nao serao protegidas (serao publicas)
    app.post('/signup', app.api.user.save);
    app.post('/signin', app.api.auth.signin);
    app.post('/validateToken', app.api.auth.validateToken);

    app.route('/users')
        .all(app.config.passport.authenticate())
        .post(app.api.user.save)
        .get(app.api.user.get);

    app.route('/users/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.user.save)
        .get(app.api.user.getById)
        .delete(admin(app.api.user.remove));

    app.route('/categories')
        .all(app.config.passport.authenticate())
        .post(app.api.category.save)
        .get(admin(app.api.category.get));

    app.route('/categories/tree')
        .all(app.config.passport.authenticate())
        .get(app.api.category.getTree);

    app.route('/categories/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.category.save)
        .get(app.api.category.getById)
        .delete(admin(app.api.category.remove));

    app.route('/articles/:id')
        .all(app.config.passport.authenticate())
        .put(admin(app.api.article.save))
        .delete(admin(app.api.article.remove))
        .get(app.api.article.getById);

    app.route('/articles')
        .all(app.config.passport.authenticate())
        .post(app.api.article.save)
        .get(app.api.article.get);
 
    app.route('/categories/:id/articles')
        .all(app.config.passport.authenticate())
        .get(app.api.article.getByCategory);
 
    app.route('/stats')
        .all(app.config.passport.authenticate())
        .get(app.api.stat.get);
 
}