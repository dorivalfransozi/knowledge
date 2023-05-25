const queries = require('./queries');

module.exports = app => {

    const { existsOrError } = app.api.validation;
    const limitArticlesPerPage = 10;

    const save = (req, res) => {
        const article = { ...req.body };
        if(req.params.id) article.id = req.params.id;


        try {
            existsOrError(article.name, 'Ivalid name');
            existsOrError(article.description, 'Invalid description');
            existsOrError(article.categoryId, 'Category did not inform');
            existsOrError(article.userId, 'Author did not inform');
            existsOrError(article.content, 'Content did not inform');
        }
        catch(msg) {
            console.log("Error: ", msg);
            res.status(400).send(msg);

            return;
        }

        if(article.id) {
            app.db('articles')
                .update(article)
                .where( { id: article.id })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err));
        } else {
            app.db('articles')
                .insert(article)
                .then(_ => res.status(204).send())
                .catch(err => {
                    console.log("insert error: ", err);
                    res.status(500).send(err);
                });
        }
    }

    const remove = async (req, res) => {
        try {
            // todo: validate req.params.id before delete
            const rowsDeleted = await app.db('articles')
                .where( { id: req.params.id })
                .del();
            existsOrError(rowsDeleted, 'Article did not find');

            res.status(204).send();
        } catch(msg) {
            res.status(500).send(msg);
        }
    }
      
    const get = async (req, res) => {
        const page = req.query.page || 1;

        const query = await app.db('articles').count('id').first();
        const count = parseInt(query.count);

        app.db('articles')
            .select('id', 'name', 'description')
            .limit(limitArticlesPerPage)
            .offset(limitArticlesPerPage * page - limitArticlesPerPage)
            .then(articles => res.json({ data: articles, count, limitArticlesPerPage }))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db('articles')
            .where({ id: req.params.id })
            .first()
            .then(article => {
                article.content = article.content.toString(); // because article come on binary format

                return res.json(article);
            })
            .catch(err => res.status(500).send(err));
    }

    const getByCategory = async (req, res) => {
        const categoryId = req.params.id;
        const page = req.query.page || 1;

        const categories = await app.db.raw(queries.categoryWithChildren, categoryId);
        const ids = categories.rows.map(c => c.id);

        app.db({a: 'articles', u: 'users'})
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', { author: 'u.name'})
            .limit(this.limitArticlesPerPage)
            .offset(page * this.limitArticlesPerPage - this.limitArticlesPerPage)
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .whereIn('categoryId', ids)
            .orderBy('a.id', 'desc')
            .then(articles => res.json(articles))
            .catch(err => res.status(500).send(err));
    }

    return { save, remove, get, getById, getByCategory }
}