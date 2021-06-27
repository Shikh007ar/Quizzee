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
const alert = require('alert');





mongoose.connect('mongodb+srv://Quizze:shikhar123@cluster0.hymwg.mongodb.net/QuizData', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: "thisisourpassword",
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
  // userDetail.plugin(findOrCreate);
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
        // console.log(movie.name);
      });
      
      res.render("portal", {printData: movie});
    } 
    else res.redirect("/");
  });

  var adminName, adminPass;

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
          // console.log(user_id);
          async function run(){
            try{
              movie = await Detail.findOne({_id: user_id});
              // console.log(movie.username);
              res.render("portal", {printData: movie });
            } catch(error){
              res.redirect("/");
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

  const questions = new mongoose.Schema({
    subject: String,
      nmbr: String,
      question: String,
      answer: String,
      option: {
        type: [String]
      }
  });
  const Question = new mongoose.model("Question", questions);
const qus = new Question({
subject: "Javascript",
  nmbr: "1",
  question: "1. Where does the majority of plastic waste end up?",
  answer: "Oceans",
  option: [
    "Recycled",
    "Oceans",
    "Burned for energy",
    "Landfills"
  ]
});
// qus.save();

let qq;
app.get("/quiz", function(req, res){
  Question.find({}, function(err, doc){
    if(err) console.log(err);
    else qq=doc;
    // console.log(doc);
  })
  console.log(qq);
  res.render("quiz", {printData: movie, foundqus: qq});
})


const admin = new mongoose.Schema({
  username: String,
  password: String
});
const Admin= new mongoose.model("Admin", admin);
const ad = new Admin({
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD
  });
  // ad.save();


var adminUser, adminPas;
app.get("/adminLogin", function(req, res){
  res.render("adminLogin");
})

app.post("/adminLogin", function(req, res){
      adminUser = req.body.username;
      adminPas  = req.body.password;
      Admin.find({"_id" : process.env.ADMIN_ID}, function(err, doc){
        // console.log(doc[0]);
        if(doc[0].username==adminUser && doc[0].password==adminPas){
          movie = doc;
          res.render("adminPortal", {printData: movie});
        }else{
          console.log("hey");
          console.log(err);
        }
      })
})

app.post("/adminPortal", function(req, res){
  const qus = new Question({
    subject: req.body.Cname,
      nmbr: req.body.anss,
      question: req.body.CQ,
      answer: req.body.QA,
      option: [
        req.body.QO1,
        req.body.QO2,
        req.body.QO3,
        req.body.QO4
      ]
    });
    qus.save();
    alert("Question is saved in respective Course database");
    res.render("adminPortal", {printData: movie});
});

app.get("/allQuiz", function(req, res){
  Question.find({}, function(err, doc){
    if(err) console.log(err);
    else qq=doc;
    console.log(doc);
  })
  // console.log(qq);
  res.render("allQuiz", {printData: movie, showQus: qq });
})

app.post("/removeQus", function(req,res){
  let clickedQus = req.body.button;
  Question.findByIdAndRemove(clickedQus, function(err){
    if(err) console.log(err);
    else {
      console.log("Data successfully Deleted!");
      res.redirect("/allQuiz");
    }
  });
})


// mongo "mongodb+srv://cluster0.hymwg.mongodb.net/myFirstDatabase" --username <username>


// app.post("/quiz", function(req, res){
//   console.log(req.body.q1);
// })

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function(){
    console.log("server started successfully!")
  });
  

  // https://fast-inlet-45370.herokuapp.com/ 