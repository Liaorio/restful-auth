var express = require('express');
var app = express();
var session = require('express-session');


var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');

var config = require('./config');
var User   = require('./models/user');

mongoose.connect(config.database, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
 
/** API */
var apiRoutes = express.Router(); 

apiRoutes.post('/setup', function(req, res) {
    let bodyObj = req.body;
    let newUser = new User({ 
        name: bodyObj.name, 
        password: bodyObj.password,
        admin: bodyObj.admin 
    });  
    newUser.save(function(err) {
        if (err) throw err;  
        res.json({ success: true });
    });
});


apiRoutes.post('/login', function(req, res) {
    User.findOne({ name: req.body.name }, function(err, user) { 
        if (err) throw err;  
        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {  
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {              
                req.session.user = "amy";
                req.session.admin = true;
                res.json({
                    success: true,
                    message: 'Welcom!',
                });
            } 
        } 
    });
});

apiRoutes.use(function(req, res, next) {
  if (req.session && req.session.user === "amy" && req.session.admin)
    return next();
  else
    return res.sendStatus(401);
});
 

apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
}); 

apiRoutes.get('/logout', function (req, res) {
    req.session.destroy();
    res.json({message: 'Bye Bye'});
});

app.use('/api', apiRoutes);
app.listen(3005);
console.log("app running at http://localhost:3005");