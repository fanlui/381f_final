const { ObjectID } = require('mongodb')

module.exports = (router) => {
  router.post('/api/restaurant/', (req, res, next) => {
    if (!req.body.name || !req.body.owner) {
      res.json({
        status: 'failed',
        msg: 'name and owner are mandatory'
      })
      return
    }
    const doc = {
      name: req.body.name,
      borough: req.body.borough,
      cuisine: req.body.cuisine,
      address: {
        street: req.body.street,
        building: req.body.building,
        zipcode: req.body.zipcode,
        coord: [req.body.lon, req.body.lat]
      },
      grades: [],
      owner: req.body.owner
    }
    if (req.file) {
      doc.photo = req.file.buffer
      doc.photo_mimetype = req.file.mimetype
    }
    const db = req.app.locals.db
    const col = db.collection('restaurants')
    col.insertOne(doc)
      .then(row => {
        res.json({
          status: 'ok',
          _id: row.insertedId
        })
      })
      .catch(err => {
        console.error(err)
        res.json({
          status: 'failed'
        })
      })
  })

  router.get('/api/restaurant/:field/:value', (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.find({
      [req.params.field]: req.params.value
    }).toArray()
      .then(docs => {
        res.json(docs)
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })
}
