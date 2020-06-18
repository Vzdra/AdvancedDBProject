//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const session = require('express-session');
const ejs = require('ejs');
const flash = require('req-flash');

const app = express();

const PORT = 3000;
const MAXAGE = 1000 * 60 * 60 * 2;
const connectionString = 'postgresql://postgres:root@localhost:5432/postgres';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(session({
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: MAXAGE,
    sameSite: true
  },
  secret: 'nbpfinki'
}));
app.use(flash());

const redirectLogin = (req, res, next) => {
  if(!req.session.userId){
    res.redirect('/login');
  }else{
    next();
  }
};

const redirectHome = (req, res, next) => {
  if(req.session.userId){
    res.redirect('/home');
  }else{
    next();
  }
};

app.get('/', (req,res) => {
  res.redirect('/home');
});

app.get('/home', (req,res) => {
  const client = new Client({
    connectionString: connectionString
  });

  console.log(req.session);

  const {succMsg, errMsg}= req.flash();
  const { userId, userName } = req.session;

  currentlyLoaded = Math.floor(Math.random() * 10000);
  client.connect();
  client.query('select * from game_catalogue.load_games(' + currentlyLoaded + ')', (err, data) => {
    client.end();
    res.render("home", {data: data.rows, userId: userId, userName: userName});
  });
});

app.get('/register', redirectHome, (req,res) => {
  const { errMsg, succMsg } = req.flash();
  const { userId, userName } = req.session;

  if(errMsg){
    res.render('register', {userId: userId, errMsg: errMsg});
  }else{
    res.render('register', {userId: userId, errMsg: errMsg});
  }
});

app.get('/login', redirectHome, (req,res) => {

  const { errMsg, succMsg } = req.flash();
  const { userId, userName } = req.session;

  res.render('login', {userId: userId, errMsg: errMsg});
});

app.post('/register', (req,res) => {
  const client = new Client({
    connectionString: connectionString
  });

  const newUser = {
    email: req.body.email,
    password: req.body.password,
    acc_status: req.body.acc_status
  };

  client.connect();
  client.query("select id, email from game_catalogue.account where email = '" + newUser.email + "' limit 1", (err, data) =>{
    if(data){
      if(data.rows.length){
        client.end();
        req.flash('errMsg', 'Email already exists!');
        res.redirect('/register');
      }else{
        client.query("insert into game_catalogue.account (email, pass, acc_status_id) values('" + newUser.email + "', '" + newUser.password + "', " + newUser.acc_status + ")", (err, succ) =>{
          if(!err){
            req.flash('succMsg', 'Successfully Registered!');
            client.end();
            res.redirect('/home');
          } else {
            console.log(err);
          }
        });
      }
    }
  });

});

app.post('/login', (req,res) => {
  const client = new Client({
    connectionString: connectionString
  });

  const potentialUser = req.body;

  client.connect();
  client.query("select id, email from game_catalogue.account where email = '" + potentialUser.email + "' and pass = '" + potentialUser.password + "'", (err, data) => {
    if(data){
      if(data.rows.length > 0){
        req.session.userId = data.rows[0].id;
        req.session.userName = data.rows[0].email;
        client.end();
        res.redirect("/home");
      }
    }
  });
});

app.post('/logout', redirectLogin,  (req,res) => {
  req.session.destroy();
  res.redirect('/home');
});



app.listen(PORT, console.log(
  "Port: " + PORT
));
