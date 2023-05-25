module.exports = app => {
    const Stat = app.mongoose.model('Stat', {
        users: Number,
        categories: Number,
        articles: Number,
        createAt: Date
    });

    const get = (req, res) => {
        Stat.findOne({}, {}, { sort: { 'createAt' : -1 } })
            .then(stat => res.json(stat));
    }

    return { Stat, get }
}