require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mysql = require('mysql2/promise');

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
        SELECT password
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


const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);


app.post('/loginUser', async (req, res) => {
    let username = req.body.username;
    console.log(username);
    let password = req.body.password;

    let results = await getUser(username);

    if(results.password === password){
        res.json({
            loginSuccess: true
        })
    }else {
        res.json({
            loginSuccess: false
        })
    }
})


app.listen(8000, () => {
    console.log(`App is listening port: ${8000}`)
})