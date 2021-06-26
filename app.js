require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const session = require("express-session");
const passport = require("passport");
const url = require("url");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findOrCreate");
const GitHubStrategy = require("Passport-GitHub2").Strategy;




mongoose.connect('mongodb://localhost:27017/QuizData', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());

let foundPath;
let user_id ,movie;
  
  const userDetail = new mongoose.Schema({
    name: String,
    lname: String,
    username: String,
    password: String,
    googleId: String,
    githubId: String,
    imagename: String, 
  });
  userDetail.plugin(passportLocalMongoose, {
    selectFields: 'username name lname imagename'
  });
  userDetail.plugin(findOrCreate);
  const Detail = new mongoose.model("Detail", userDetail);
  
  passport.use(Detail.createStrategy());
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    Detail.findById(id, function(err, user) {
      done(err, user);
    });
  });



  
// for google authentication
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/portal",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    Detail.findOrCreate({ googleId: profile.id, name: profile.name.givenName, lname: profile.name.familyName, imagename: profile.photos[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));


// for github authentication
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/portal"
  },
  function(accessToken, refreshToken, profile, done) {
    // console.log(profile);
    Detail.findOrCreate({ githubId: profile.id, name: profile.username, imagename: profile.photos[0].value  }, function (err, user) {
      return done(err, user);
    });
  }
));


// routes for google authentication
app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] })
);
app.get("/auth/google/portal",
  passport.authenticate("google", { failureRedirect: '/loginRegister' }),
  function(req, res) {
    // movie = req.user;
    res.redirect("/portal");
  });






  app.get("/", function(req, res){
    res.render("index");
});

// app.get("/loginRegister", function(req, res){
//     console.log("hello");
//     res.render("loginRegister");
// })

app.get("/register", function(req, res){
    res.render("register");
})



const Storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
      cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
  });
const upload = multer({ storage: Storage }).single("inpFile");


  app.post("/register", upload,  function(req, res, next){
    Detail.register( new Detail({username: req.body.username, name: req.body.first, lname: req.body.last, imagename: req.file.filename}), req.body.password, function(err, detail){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req, res, function(){
          console.log("Registered");
          res.redirect("/portal");
        })
      }
    })
  });

  app.get("/portal", function(req, res){
    if(req.isAuthenticated()){
      console.log(req.user._id);
      Detail.findById(req.user._id, function(err, doc){
        if(err) console.log(err);
        else movie = doc;
      });
      console.log(movie);
      res.render("portal", {printData: movie});
    } 
    else res.redirect("/");
  });


  app.post("/login", function(req, res){
 
    const user = new Detail({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err){
      if(err) {
        console.log(err);
      }
      else{
        passport.authenticate("local")(req, res, function(){
          user_id = req.user._id;
          console.log(user_id);
          async function run(){
            try{
              movie = await Detail.findOne({_id: user_id});
              console.log(movie.username);
              res.render("portal", {printData: movie });
            //   if(foundPath === "/loginRegister") 
  
              
        //   else{
        //     res.redirect(foundPath);
        //   }
            } catch(error){
              console.log(error);
            }
          }
          run();
        });
      }
    })
  });

  app.post("/logout", function(req, res){
    req.logout();
    res.redirect("/");
  });







app.listen(3000, function(){
    console.log("server is running on port 3000")
  });
  