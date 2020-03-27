// Const en Requires

const express = require('express')
const app = express()
const port = 3000                                     // Localhost:3000
const bodyParser = require('body-parser')             // Body-parser laat server weten wat voor data er binnen komt
const multer  = require('multer')
const slug = require('slug')                          // Slug maakt url save (verandert leestekens goed)
const session = require('express-session')
const upload = multer({dest:'static/upload/'})
require('dotenv').config()                            // Zodat je process.env.DB_USER etc. kunt gebruiken
 ObjectID = require('mongodb').ObjectID; 			      // mongo database



// Database MongoDB

var db;                                               // Connect met de database van Mongo
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@projecttech-hvfp2.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true } );
  client.connect((err, client, res) => {
    if (err) {
      console.log(err)
    }
    db = client.db(process.env.DB_NAME);
  });



// SET en USE

app.set('view engine', 'ejs')                         // Template engine EJS
app.set('views', 'views')                             // Alle EJS bestanden in de map views
app.use(express.static('static'))                     // Andere mogelijkheid voor kortere linkjes: app.use('/static', express.static(__dirname + '/static));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  }))



// GET: (get stuurt url naar client na aanvraag naar de server)

app.get('/', (req, res) => res.render('index.ejs', {title:'Maak een profiel aan'}))

app.get('/profile/:id', profile)

function profile(req, res) {
  db.collection('profiles').findOne(
    {_id: ObjectID(req.params.id)},									                      // Zoek de _id in het ObjectID van MongoDB, met param.id die uit de url komt. De specifieke _id uit MongoDB, van de gebruiker die hier in de req.params.id zit.
    function (err) {												                              // Deze functie gaat af indien er iets is gevonden / of niet
      if (err) throw err; 													                      // Error
      res.render('result.ejs', req.session.user);							            // Als je iets uit result wilt renderen in je ejs - mongo database
  });
}

app.get('/update/:id', findIDtoUpdateResultPage);                         // Dit stuurt de user naar de overzichtspagina met alle ingevulde data

function findIDtoUpdateResultPage(req, res) {
	db.collection('profiles').findOne(										                  // Vind 1 object uit de 'profiles' collection van m'n Mongo database
		{_id: ObjectID(req.session.user._id)},									              // Zoek de _id in het ObjectID van MongoDB, met param.id die uit de url komt. De specifieke _id uit MongoDB, van de gebruiker die hier in de req.params.id zit.
		function (err, result) {												                      // Deze functie gaat af indien er iets is gevonden / of niet
			if (err) throw err; 													                      // Error
			res.render('update.ejs', result);							                      // Als je iets uit result wilt renderen in je ejs - mongo database
		});
}


app.get('*', (req, res) => res.send('404 error not found'))               // Als je op een route komt die ik niet gedefinieerd heb, laat hij een error zien



// POST: (client post data in de database via de server)

app.post('/add-profile', upload.single('cover'), myForm)

function myForm(req, res){
  const id = slug(req.body.username).toLowerCase()
  req.session.user = {
	  username: req.body.username,
	  regio: req.body.regio,
	  jaar: req.body.jaar,
    gender:req.body.gender,
    biografie: req.body.biografie,
    cover: req.file ? req.file.filename : null
  }
    db.collection('profiles').insertOne(req.session.user, callback);               // Profiles is een map in de database waar req.session.user geinsered wordt
    function callback (err){
      res.redirect('profile/' + req.session.user._id);
    }
}

app.post('/sendUpdate', updateBio);                           // Form actie update updateBiografie in Biografie

function updateBio(req, res){
	db.collection('profiles').updateOne(						           	// Update iets wat in de collection 'user' zit van MongoDB.
		{_id: ObjectID(req.session.user._id)},							      // Zoek de _id in het ObjectID van MongoDB, met param.id die uit de url komt. De specifieke _id uit MongoDB, van de gebruiker die hier in de req.body.id zit.
		{ $set: {biografie: req.body.updateBiografie} },          // verandert in de Mongo database de textProfile naar updateTextProfile die is ingevuld.
		(err)=>{																		              // nieuwe manier van function schrijven.
			if (err) throw err;												              // indien error, stuur error
			res.redirect('update/' + req.session.user._id);	        // ga terug naar de mijn_profiel.ejs incl. de juiste _id uit de database. Geen req.session.user._id, omdat dat local was en je hier dus niet kan gebruiken.
		});
}



// listen altijd als laatste
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
