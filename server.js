require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const path  = require('path');
const bodyParser = require("body-parser");
const multer  = require('multer');
const _ = require('lodash');
const passport = require("passport");
const crypto = require("crypto");
const passportLocalMongoose  = require("passport-local-mongoose");
const session = require("express-session");


const app = express();
port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("partial"));

var Storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req,file,cb)=>{
        cb(null,file.fieldname+'-'+Date.now()+path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage:Storage,
}).single('file');

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
const DB = process.env.DATABASE.replace('<PASSWORD>' , process.env.DATABASE_PASS);
mongoose.connect(DB||'mongodb://localhost:27017/endeavourDB', 
{useNewUrlParser: true, 
  useUnifiedTopology: true,
   useFindAndModify: false}).then(con =>{
    //  console.log(con.connections);
     console.log("DB connection successful");
   });
mongoose.set("useCreateIndex",true);
const userSchema=new mongoose.Schema({
    userName:String,
    email:String,
    regno:String, // this is new RegExp()
    pastexp:String, // this is new field for past experience
    password:String,
    trade:String,
    image:String,
    languages:String,
    teamPosition:String,
    FBlink:String,
    LinkedIn:String,
    skills:String,
    about:String,
    joiningYear:String,
    projectWork:String,
    internship:String,
    Cstatus:String,
});
userSchema.plugin(passportLocalMongoose);
const Form=mongoose.model("Form",userSchema);

passport.use(Form.createStrategy());
passport.serializeUser(Form.serializeUser());
passport.deserializeUser(Form.deserializeUser());

////// GETTING HOME ROUTE 
app.get("/", function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/MembersPage");
      }
      else{
        res.render("index");
      }
});
////////////////////////////////////////////////////////////////////////////////////

// GETTING PROFILES //////////////////////////////////
app.get("/profile", function(req, res){
    if(req.isAuthenticated()){

      Form.findById(req.user.id,function(err,user){
        if(err){
          console.log(err);
        } else{
          console.log(user);
          res.render("profile",{
            image:req.user.image,
            name:req.user.userName,
            userid:req.user.id,
            member:req.user.teamPosition,
            year:req.user.joiningYear,
            user:user,
        });
      
        }
      })
        
      }
      else{
        res.redirect("/MembersLogin");
      }
})
///////////////////////////////////////////////////////////////////////////////////////////

// PAGE AFTER IF THE MEMBER IS LOGGED IN
app.get("/MembersPage", function(req,res){
    if(req.isAuthenticated()){
      
        res.render("memberspage",{memberName:req.user.userName});
      }
      else{
        res.redirect("/MembersLogin");
      }
});
/////////////////////////////////////////////////////////////////////////////////////////////

// HANDLING LOGOUT OF THE USER
app.get("/logout", function(req,res){
    req.logOut();
    res.redirect("/");
  });
//////////////////////////////////////////////////////////////////////////////

///// HANDLING THE UPDATION OF THE FORM FIELDS
  app.post("/InfoUpdate", function(req,res){
    if(req.isAuthenticated()){

// updating profile info
    Form.findByIdAndUpdate(req.user.id,{
      trade:req.body.userTrade,
      FBlink:req.body.fb,
      LinkedIn:req.body.linkedin,
      languages:req.body.userLanguage,
      teamPosition:req.body.userPosition,
      skills:req.body.userSkills,
      about:req.body.userAbout,
     
      projectWork:req.body.userProject,
      internship:req.body.userIntern,
      Cstatus:req.body.userCurrent},
       function(err, user){
      if(err){
        console.log(user);
        console.log(err);
      }
      else{
        console.log("Success");
        res.redirect("/profile");
      }
    });
  }
  else{
    res.redirect("/MembersLogin");
  }
  });
/////////////////////////////////////////////////////////////////////////////////////////////////

// DISPLAYING THE TEAM PAGE 
app.get("/team", function(req,res){
    Form.find({ teamPosition:'Member'},function(err,results){
        Form.find({ teamPosition:'Coordinator'},function(err,results0){
            Form.find({ teamPosition:'Alumni'},function(err,results1){
                Form.find({ teamPosition:'Committee Member'},function(err,results2){
                   Form.find({ teamPosition:{ $regex: 'Head'}},function(err,results3){
                    res.render("aboutTeam",{hello:results,hello1:results2,hello2:results0,hello3:results3,hello4:results1});
                });
            });
        });
     });
 });
});
//////////////////////////////////////////////////

///////REGISTRATION FORM 
app.get("/MembersRegister",function(req,res){
    res.render("home");
});
//////////////////////////////////////////////////////

///LOGIN SCREEN
app.get("/MembersLogin",function(req,res){
    res.render("loginScreen");
});
//////////////////////////////////////////////////////////////////

///// REGISTRTAION FIELD RECEIVE
app.post("/formsubmit", upload, function(req,res){
    var imgFile= req.file.filename;
    var naam = _.startCase(req.body.userName);

Form.findOne({userName:naam},function(err,foundName){
  console.log(foundName);
  if(!err){
        if(!foundName){
                  Form.register({username:req.body.userEmail,
                    userName:naam,
                    email:req.body.userEmail,
                    trade:req.body.userTrade,
                    FBlink:req.body.fb,
                    regno:req.body.userReg,
                    pastexp:req.body.userWork,
                    LinkedIn:req.body.linkedin,
                    image:imgFile,
                    languages:req.body.userLanguage,
                    teamPosition:req.body.userPosition,
                    skills:req.body.userSkills,
                    about:req.body.userAbout,
                    joiningYear:req.body.userYear,
                    projectWork:req.body.userProject,
                    internship:req.body.userIntern,
                    Cstatus:req.body.userCurrent}, req.body.password,function(err,user){
                    if(err){
                        console.log(err);
                        res.redirect("/MembersRegister");
                    } 
                    else{
                        res.render("success");
                    }
                });
        }else{
          console.log("user already exist!")
          res.render("fail");
        }
  }
})
 });
/////////////////////////////////////////////////////////////////////////////////////////

// express routing parameter
app.get("/member/:memberId",function(req,res){
    const requestedMemberId = req.params.memberId;
    Form.findById(requestedMemberId,function(err,post){
        res.render("memberprofile",{
            userName:post.userName,
            RegNo:post.regno,
            email:post.email,
            trade:post.trade,
            image:post.image,
            languages:post.languages,
            teamPosition:post.teamPosition,
            FBlink:post.FBlink,
            LinkedIn:post.LinkedIn,
            skills:post.skills,
            about:post.about,
            joiningYear:post.joiningYear,
            projectWork:post.projectWork,
            internship:post.internship,
            Cstatus:post.Cstatus,
        });
    });
});
////////////////////////////////////////////////////////////////////////////////

//GETTING IN LOGIN DETAILS AND AUTHNTICATING
app.post("/login", function(req,res){
    const user = new Form({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err){
      if(err){
        console.log(err);
      }
      else{
        passport.authenticate('local')(req,res, function(){
          res.redirect("/MembersPage");
        });
      }
    });
  });
//////////////////////////////////////////////////
// app.get("/result",function(req,res){
//     Form.find({},function(err,results){
//         console.log(results);
//         res.render("disp",{ hello:results});
//     });
// });

app.listen(port, function(req,res){
    console.log("server started at port 3000");
});

