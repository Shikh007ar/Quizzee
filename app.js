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



app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res){
    console.log("hello");
    res.render("index");
})


app.get("/register", function(req, res){
    res.render("register");
})












app.listen(3000, function(){
    console.log("server is running on port 3000")
  });
  