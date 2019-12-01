module.exports = (router) => {
  router.get('/logout', (req, res) => {
    req.session.user = null
    res.redirect('/login')
  })

  router.get('/login', (req, res) => res.render('pages/login'))
  router.post('/login', (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('users')
    col.find({ userid: req.body.userid, password: req.body.password }).toArray()
      .then(docs => {
        if (docs && docs.length > 0) {
          req.session.user = {
            _id: docs[0]._id,
            userid: docs[0].userid
          }
          res.redirect('/')
        } else {
          res.render('pages/login', {
            msg: {
              type: 'danger',
              text: 'Userid or password incorrect.'
            }
          })
        }
      })
      .catch(err => {
        console.error(err)
        next(err)
      })

  })

  router.get('/register', (req, res) => res.render('pages/register'))
  router.post('/register', (req, res, next) => {
    const db = req.app.locals.db
    const col = db.collection('users')

    col.find({ userid: req.body.userid }).toArray()
      .then(docs => {
        if (docs && docs.length > 0) {
          res.render('pages/register', {
            msg: {
              type: 'warning',
              text: 'User already exist!'
            }
          })
          return Promise.resolve()
        } else {
          return col.insertOne({ userid: req.body.userid, password: req.body.password })
        }
      })
      .then(row => {
        if (row) {
          res.render('pages/login', {
            msg: {
              type: 'success',
              text: 'Success! pls login now.'
            }
          })
        }
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  })
}

