var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken');
var config = require('./config');
var User   = require('./models/user');

var port = process.env.PORT || 8080;
mongoose.connect(config.database, { useNewUrlParser: true });
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// use morgan to log requests to the console
app.use(morgan('dev'));


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

apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({ name: req.body.name }, function(err, user) { 
        if (err) throw err;  
        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {  
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {
                const payload = { admin: user.admin };
                let token = jwt.sign(
                    payload, 
                    app.get('superSecret'), 
                    { expiresIn: '1h' }
                );
                
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            } 
        } 
    });
});

apiRoutes.use(function(req, res, next) {
    console.log(req.headers);
    let token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) { 
        jwt.verify(
            token, 
            app.get('superSecret'), 
            function(err, decoded) {       
                if (err) {
                    return res.json({ success: false, message: 'Failed to authenticate token.' });       
                } else {
                    req.decoded = decoded;         
                    next();
                }
        });  
    } else {
        return res.status(403).send({ 
            success: false, 
            message: 'No token provided.' 
        });
    }
});

apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
}); 




app.use('/api', apiRoutes);
app.listen(port);
console.log('Magic happens at http://localhost:' + port);