const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })
const { ObjectID } = require('mongodb')

module.exports = (router) => {
  function isLogin (req, res, next) {
    if (req.session.user) {
      next()
    } else {
      res.redirect('/login')
    }
  }

  router.get('/', isLogin, (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.find().toArray()
      .then(docs => {
        res.render('pages/index', {
          user: req.session.user,
          list: docs,
          search: {}
        })
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/search', isLogin, (req, res, next) => {
    const search = {}
    if (req.query.name) {
      search.name = req.query.name
    }
    if (req.query.borough) {
      search.borough = req.query.borough
    }
    if (req.query.cuisine) {
      search.cuisine = req.query.cuisine
    }
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.find(search).toArray()
      .then(docs => {
        res.render('pages/index', {
          user: req.session.user,
          list: docs,
          search
        })
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/new', isLogin, (req, res) => res.render('pages/new'))
  router.post('/new', isLogin, upload.single('photo'), (req, res, next) => {
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
      owner: req.session.user.userid
    }
    if (req.file) {
      doc.photo = req.file.buffer
      doc.photo_mimetype = req.file.mimetype
    }
    const db = req.app.locals.db
    const col = db.collection('restaurants')
    col.insertOne(doc)
      .then(row => {
        res.redirect('/')
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/display', isLogin, (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.findOne({ _id: new ObjectID(req.query._id) })
      .then(doc => {
        res.render('pages/view', {
          data: doc
        })
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/edit', isLogin, (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.findOne({ _id: new ObjectID(req.query._id) })
      .then(doc => {
        if (doc.owner === req.session.user.userid) {
          res.render('pages/edit', {
            data: doc
          })
        } else {
          res.render('pages/view', {
            data: doc,
            msg: {
              type: 'warning',
              text: 'You must be the owner of this record to operate.'
            }
          })
        }
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })
  router.post('/edit', isLogin, upload.single('photo'), (req, res, next) => {
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
      owner: req.session.user.userid
    }
    if (req.file) {
      doc.photo = req.file.buffer
      doc.photo_mimetype = req.file.mimetype
    }
    const db = req.app.locals.db
    const col = db.collection('restaurants')
    col.findOneAndUpdate({
      _id: ObjectID(req.body._id),
      owner: req.session.user.userid
    }, {
      $set: doc
    })
      .then(row => {
        if (row.value) {
          res.redirect('/display?_id=' + req.body._id)
        } else {
          res.render('pages/edit', {
            msg: {
              type: 'warning',
              text: 'You must be the owner of this record to operate.'
            },
            data: {
              _id: req.body._id,
              ...doc
            }
          })
        }
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/delete', isLogin, (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.findOne({ _id: new ObjectID(req.query._id) })
      .then(doc => {
        if (doc.owner.toString() === req.session.user.userid) {
          return col.findOneAndDelete({ _id: new ObjectID(req.query._id) })
        } else {
          res.render('pages/view', {
            msg: {
              type: 'warning',
              text: 'You must be the owner of this record to operate.'
            },
            data: doc
          })
          return Promise.resolve()
        }
      })
      .then(row => {
        if (row) {
          res.redirect('/')
        }
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/rate', isLogin, (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')

    col.findOne({ _id: new ObjectID(req.query._id) })
      .then(doc => {
        res.render('pages/rate', {
          data: doc
        })
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })
  router.post('/rate', isLogin, (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('restaurants')
    col.findOne({ _id: new ObjectID(req.body._id) })
      .then(doc => {
        const prevRate = doc.grades.filter(v => v.user === req.session.user.userid)
        if (prevRate.length) {
          res.render('pages/rate', {
            msg: {
              type: 'warning',
              text: 'You have already rated this record.'
            },
            data: doc
          })
          return Promise.resolve()
        } else {
          doc.grades.push({
            user: req.session.user.userid,
            score: req.body.score
          })
          return col.findOneAndUpdate({
            _id: ObjectID(req.body._id)
          }, {
            $set: {
              grades: doc.grades
            }
          })
        }
      })
      .then(row => {
        if (row) {
          res.redirect('/display?_id=' + req.body._id)
        }
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })

  router.get('/map', isLogin, (req, res, next) => {
    res.render('pages/map', {
      lon: Number(req.query.lon),
      lat: Number(req.query.lat)
    })
  })
}

