const express = require('express')
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const app = express()
const path = require('path')
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(
  process.env.DB_URL,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// settings
const port = 3000
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: process.env.DB_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/', require('./routes/routes.js'))
app.use('/auth', require('./routes/users.js'))
app.use('/account', require('./routes/account.js'))
// app.use(function (req,res,next){
// 	res.status(404).redirect('/');
// });

app.use(express.static(path.join(__dirname, 'public')))


app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})