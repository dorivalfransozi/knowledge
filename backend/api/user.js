const bcrypt = require('bcrypt-nodejs');

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError } = app.api.validation;
    
    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }
    
    const save = async (req, res) => {

        const user = { ...req.body }; // using spread to create user
        if(req.params.id) user.id = req.params.id;

        // rule to prevent anyone add an admin
        if(!req.originalUrl.startsWith('/users')) user.admin = false;
        if(!req.user || !req.user.admin) user.admin = false;

        try {
            
            existsOrError(user.name, 'Nome não informado');
            existsOrError(user.email, 'E-mail não informado');
            existsOrError(user.password, 'Senha não informada');
            existsOrError(user.confirmPassword, 'Confirmação de senha não informada');
            equalsOrError(user.password, user.confirmPassword, 'Senha não confere');

            const userFromDB = await app.db('users')
                .where({ email: user.email })
                .first();

            if(!user.id) {
                notExistsOrError(userFromDB, 'Usuário já cadastrado');
            }
        } catch(msg) {
            console.log('Error', msg)
            return res.status(400).send(msg);
        }

        user.password = encryptPassword(user.password);
        delete user.confirmPassword;

        if(user.id) {
            app.db('users')
                .update(user)
                .where({ id: user.id })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err));
        } else {
            app.db('users')
                .insert(user)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err));
        }
    }

    const get = (req, res) => {
        app.db('users')
            .select('id','name','email','admin')
            .whereNull('deletedAt')
            .then(users => res.json(users)) // aqui seria feito a conversao caso nome do campo é diff do atributo
            .catch(err => res.status(500).send(err));
    }

    const getById = (req, res) => {
        
        app.db('users')
            .select('id','name','email','admin')
            .where( { id: req.params.id })
            .whereNull('deletedAt')
            .first()
            .then(users => res.json(users)) // aqui seria feito a conversao caso nome do campo é diff do atributo
            .catch(err => res.status(500).send(err));
    }

    const remove = async (req, res) => {
        try {
            const articles = await app.db('articles')
                .where( { userId: req.params.id });
            notExistsOrError(articles, 'User has articles.');

            const rowsUpdated = await app.db('users')
                .update( { deletedAt: new Date() })
                .where( { id: req.params.id });
            existsOrError(rowsUpdated, 'User was not found');

            res.status(204).send();
        } catch(msg) {
            console.log(msg);
            res.status(400).send(msg);
        }
    }

    return { save, get, getById, remove }
}