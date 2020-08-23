const restify = require('restify'),
    constant = require('./const')

var server = restify.createServer()

server.get('/test/:name', (req, res, next) => {
    res.send('test ' + req.params.name)
    next()
})

server.get('/:name', (req, res, next) => {
    console.log(req)
    res.send('hello ' + req.params.name)
    next()
})

server.listen(getServicePort(), function() {
  console.log('%s listening at %s', server.name, server.url);
})

function getServicePort() {
    if (process.env.NODE_ENV === constant.ENV_PRODUCTION) {
        return constant.production.service.PORT
    } else {
        return constant.development.service.PORT
    }
}