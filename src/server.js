const { OPEN_READWRITE, OPEN_CREATE } = require('sqlite3')

const restify = require('restify'),
  sqlite3 = require('sqlite3').verbose(),
  db = new sqlite3.Database('main.sqlite', OPEN_READWRITE | OPEN_CREATE, (err) => {
    console.log(err)
  })
  // custom modules
  constant = require('./const')

var server = restify.createServer()

server.use(restify.plugins.queryParser())

server.get('/test/:name', (req, res, next) => {
  res.send('test ' + req.params.name)
  next()
})

server.get('/:name', (req, res, next) => {
  console.log(req)
  let TargetHost = stripPortFromHost(req.headers.host)
  db.all('select * from main where host = ? and key = ?', TargetHost, req.params.name, (err, recs) => {
    if (err) {
      console.error(err)
      res.send(err.message)
    } else {
      if (recs.length === 0) {
        res.send('Key ' + req.params.name + ' not registered')
      } else {
        return res.redirect(302, recs[0].url, next)
      }
    }
    next(false)
  })

})

server.get('/list/:host', (req, res, next) => {
  // NOTE: needs to change
  if (req.query.p === 'peekaboo') {
    db.all('select * from main where host = ?', req.params.host, (err, recs) => {
      if (err) {
        console.error(err)
        res.send(err.message)
      } else {
        let out = ''
        out = recs.reduce((final, item) => {
          return final + item.key + ' = ' + item.url + '\n' 
        }, '')
        res.set('content-type', 'text/plain')
        res.send(out)
      }
      next(false)
    })
  } else {
    res.send(401, 'Unauthorised command')
    next(false)
  }
})

server.get('/set/:host/:name', (req, res, next) => {
  console.log('Setting shortener')
  console.log(req.params.host)
  console.log(req.params.name)
  console.log(req.query.h)
  console.log(req.query.p)

  // NOTE: needs to change
  if (req.query.p === 'peekaboo') {
    db.run('replace into main(host, key, url) values (?,?,?)', req.params.host, req.params.name, req.query.h, (err, recs) => {
      if (err) {
        console.error(err)
        res.send(err.message)
      } else {
        console.log(recs)
        console.log(this)
        res.send('OK')
      }
      next(false)
    })
  } else {
    res.send(401, 'Unauthorised command')
    next(false)
  }
})

server.listen(getServicePort(), async function() {
  console.log('%s listening at %s', server.name, server.url);
  process.on('SIGTERM', () => stopAll('SIGTERM'))
  process.on('SIGINT', () => stopAll('SIGINT'))

  db.exec('create table if not exists main (' +
    'host text not null,' +
    'key text not null,' +
    'url text not null,' +
    'primary key(host, key)' +
    ')'
  )

})

function stripPortFromHost(host) {
  let idx = host.indexOf(':')
  return (idx > -1) ? host.substring(0, idx) : host
}

function isTableExist() {
  db.all('select count(*) as total from sqlite_master where type = "table" and name = "main"', (err, recs) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    return recs[0].total > 0
  })
}

function stopAll(signal) {
  console.log('Stopping on ' + signal)
  // db.close()
  console.log('Stopping service')
  server.close(() => {
      console.log('Service stopped')
  })
  setTimeout(() => {
      process.exit(0)
  }, constant.TIMEOUT_FORCESTOP)
}

function getServicePort() {
  if (process.env.NODE_ENV === constant.ENV_PRODUCTION) {
    return constant.production.service.PORT
  } else {
    return constant.development.service.PORT
  }
}