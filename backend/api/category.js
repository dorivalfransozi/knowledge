module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError } = app.api.validation;
    
    const save = async (req, res) => {

        const category = { ...req.body }; // using spread to create user
        if(req.params.id) category.id = req.params.id;

        try {
            existsOrError(category.name, 'Categoria não informada');
        } catch(msg) {
            console.log('Error', msg)
            return res.status(400).send(msg);
        }

        if(category.id) {
            app.db('categories')
                .update(category)
                .where({ id: category.id })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err));
        } else {
            app.db('categories')
                .insert(category)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err));
        }
    }

    const remove = async (req, res) => {
        try {
            existsOrError(req.params.id, 'Código da categoria não informado.');

            const subcategory = await app.db('categories')
                .where({ parentId: req.params.id });

            notExistsOrError(subcategory, `Categoria possui subcategorias ${subcategory[0].id}`)    

            const articles = await app.db('articles')
                .where({ categoryId: req.params.id })

            notExistsOrError(articles, `Categoria possui artigos ${articles[0].id}`)    

            const rowsDeleted = await app.db('categories')
                .where({ id: req.params.id })
                .del();

            existsOrError(rowsDeleted, 'Categoria não encontrada.');

            res.status(204).send();

        } catch(msg) {
            console.log('Error', msg)
            return res.status(400).send(msg);
        }
    }

     const withPath = categories => {
        const getParent = (categories, parentId) => {
            const parent = categories.filter(parent => parent.id === parentId);
            return parent.length ? parent[0] : null;
        }

        let categoriesWithPath = categories.map(category => {
            let path = category.name;
            let parent = getParent(categories, category.parentId);

            while(parent) {
                path = `${parent.name} > ${path}`;
                parent = getParent(categories, parent.parentId);
            }

            return { ...category, path }
        });

        categoriesWithPath.sort((a, b) => {
            if(a.path < b.path) return -1;
            if(a.path > b.path) return 1;
            return 0;
        });

        return categoriesWithPath
    }

    const get = (req, res) => {
        app.db('categories')
            .then(categories => res.json(withPath(categories)))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db('categories')
            .where({ id: req.params.id})
            .first()
            .then(categories => res.json(categories))
            .catch(err => res.status(500).send(err))
    }

    const toTree = (categories, tree) => {
        if(!tree) tree = categories.filter(c => !c.parentId);

        tree = tree.map(parentNode => {
            const isChild = node => (node.parentId == parentNode.id); 
            parentNode.children = toTree(categories, categories.filter(isChild));

            return parentNode;
        })

        return tree;
    }

    const getTree = (req, res) => {
        app.db('categories')
            .then(cagetories => res.json(toTree(withPath(cagetories), null)))
            .catch(err => res.status(500).send(err));
    }

    return { save, remove, get, getById, getTree }
}