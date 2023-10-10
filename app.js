require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');

const expireTime = 60 * 60 * 1000;

const app = express();


mongoose.connect(process.env.MONGO_URL, {});
mongoose.connection.once('open', () => {
    console.log('MongoDB: connected...')
})

let mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    crypto: {
        secret: process.env.MONGO_SESSION_SECRET
    },
    collectionName: "sessions"
})


const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

let dbConfig = {
    host: process.env.MYSQL_HOST,   
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
}

let database = mysql.createPool(dbConfig);

async function getUser(username){
    let getUserSQL = `
        SELECT *
        FROM users
        WHERE username = (?)
    `

    let param = [username];

    try{
        let results = await database.query(getUserSQL, param);
        return results[0][0];
    }catch(e){
        console.log(e);
    }
}


// app.use section
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(session({
    secret: process.env.NODE_SECRET_SESSION,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: expireTime,
        secure: false
    }
}));

const corsOptions = {
    origin:'*', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200,
 }
app.use(cors(corsOptions));



app.post('/loginUser', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    
    let results = await getUser(username);

    if(results.password === password){
        req.session.authenticated = true;
        req.session.username = results.username;
        req.session.cookie.maxAge = expireTime;
        let sessionID = req.sessionID;
        res.json({
            loginSuccess: true,
            sessionID: sessionID
        });

        return;
    }else {
        res.json({
            loginSuccess: false,
            sessionID: req.sessionID
        })
        return;
    }
})

app.post('/landing', async (req, res) => {
    console.log("cookie sessionid: " + req.body.sessionID)
    req.sessionStore.get(req.body.sessionID, (e, session) => {
        if (session.authenticated){
            res.json({
                username: session.username
            })
        }
    })
})

app.get('/', (req, res) => {
    res.json({
        api: "SAMS API"
    })
})

app.get('*', (req, res) => {
    res.json({
        api: "404"
    })
})


app.listen(8000, () => {
    console.log(`App is listening port: ${8000}`)
})