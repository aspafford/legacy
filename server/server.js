var express = require("express");
var mongoose = require('mongoose');
var Q = require('q');
var uriUtil = require('mongodb-uri');
var aws = require('aws-sdk');

var User = require('./users/userModel.js');

var app = express();

var port = process.env.PORT || 3000;
var nodemailer = require("nodemailer");


//---------------------------------------------------------------------
// ***** Previous mongoLab credentials *****
var dbuser = 'admin';
var dbpassword = 'admin';

//set up URI connection to mongolab
var uristring = process.env.MONGOLAB_URI || 
process.env.MOGOHQ_URL ||
'mongodb://' + dbuser + ':' + dbpassword + '@ds043714.mongolab.com:43714/foodly';


// ***** ShortCut mongoLab credentials ******
// var dbuser = 'ryan';
// var dbpassword = 'gaaame';

// //set up URI connection to mongolab
// var uristring = process.env.MONGOLAB_URI || 
// process.env.MOGOHQ_URL ||
// 'mongodb://' + dbuser + ':' + dbpassword + '@ds049104.mongolab.com:49104/gaaame_db';

var mongooseUri = uriUtil.formatMongoose(uristring);

var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } }; 

mongoose.connect(mongooseUri, options);
var db = mongoose.connection;

db.once('open',function(){
  console.log('connected to : ', mongooseUri);
})

require('./config/middleware.js')(app, express);

var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET

app.get('/sign_s3', function(req, res){
    aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});
    var s3 = new aws.S3();
    var s3_params = {
        Bucket: S3_BUCKET,
        Key: req.query.file_name,
        Expires: 60,
        ContentType: req.query.file_type,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3_params, function(err, data){
        if(err){
            console.log(err);
        }
        else{
            var return_data = {
                signed_request: data,
                url: 'https://'+S3_BUCKET+'.s3.amazonaws.com/'+req.query.file_name
            };
            res.write(JSON.stringify(return_data));
            res.end();
        }
    });
});

app.listen(port);
console.log('Server now listening on port ' + port);

module.exports = app;

// var Schema = mongoose.Schema;

// nodemailer code (sends email notification from foodlymailer@gmail to vendor whenever customer places an order)
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: "foodlymailer@gmail.com",
    pass: "foodly123"
  }
});
/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/

app.get('/send', function(req, res) {
  var mailOptions = {
    to: req.query.to,
    subject: req.query.subject,
    text: req.query.text
  }
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function(error, response) {
    if (error) {
      console.log(error);
      res.end("error");
    } else {
      console.log("Message sent: " + response.message);
      res.end("sent");
    }
  });
});


// var userCreate = Q.nbind(User.create, User);
//   var newUser = {
//    'username' : 'bob dobalina',
//    'password' : '12345'
//   };
//   userCreate(newUser);
