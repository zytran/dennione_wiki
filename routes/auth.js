var express = require('express');

var router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

module.exports = router;
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

