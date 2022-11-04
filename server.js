const express = require("express");
const path = require("path");
const data = require("./data-service.js");
// const bodyParser = require('body-parser');
const fs = require("fs");
const multer = require("multer");
const app = express();
const exphbs = require('express-handlebars')
    app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
    app.set('view engine', '.hbs'); 

const HTTP_PORT = process.env.PORT || 8080;

// multer requires a few options to be setup to store files with file extensions
// by default it won't store extensions for security reasons
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) 
    {
      // we write the filename as the current date down to the millisecond
      // in a large web service this would possibly cause a problem if two people
      // uploaded an image at the exact same time. A better way would be to use GUID's for filenames.
      // this is a simple example.
      cb(null, Date.now() + path.extname(file.originalname));
    }
});

// tell multer to use the diskStorage function for naming files instead of the default.
const upload = multer({ storage: storage });


app.use(express.static('public'));
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(function(req, res, next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

app.engine('.hbs', exphbs.engine    ({
    extname: '.hbs',
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return '<li' +
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    }
  
    }
  }));
  

app.get("render", (req,res) => {
    res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/res.render", (req,res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get("/res.render", (req,res) => {
    res.sendFile(path.join(__dirname, "/views/addImage.html"));
});

app.get("/res.render", (req,res) => {
    res.sendFile(path.join(__dirname, "/views/addStudent.html"));
});

app.get("/images", (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.json({images:items});
    });
});

app.get("/students", (req, res) => {
    if (req.query.status) {
        data.getStudentsByStatus(req.query.status).then((data) => {
            res.json(data);
        }).catch((err) => {
            res.json({ message: "no results" });
        });
    } else if (req.query.program) {
        data.getStudentsByProgramCode(req.query.program).then((data) => {
            res.json(data);
        }).catch((err) => {
            res.json({ message: "no results" });
        });
    } else if (req.query.credential) {
       data.getStudentsByExpectedCredential(req.query.credential).then((data) => {
           res.json(data);
       }).catch((err) => {
           res.json({ message: "no results" });
       });
    } else {
        data.getAllStudents().then((data) => {
            res.json(data);
        }).catch((err) => {
            res.json({ message: "no results" });
        });
    }
});

app.get("/student/:studentId", (req, res) => {
    data.getStudentById(req.params.studentId).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.json({message:"no results"});
    });
});

app.get("/intlstudents", (req,res) => {
    data.getInternationalStudents().then((data)=>{
        res.json(data);
    });
});

app.get("/programs", (req,res) => {
    data.getPrograms().then((data)=>{
        res.json(data);
    });
});


app.post("/students/add", (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    });
});

app.post("/images/add", upload.single("imageFile"), (req,res) =>{
    res.redirect("/images");
});


app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

