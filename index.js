const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')

const client = {
    clientId: 'application1',
    clientSecret: 'secret1'
}

const app = express()

app.set('views', path.resolve(__dirname, './views'))
app.set('view engine', 'jade')

app.use(bodyParser.json())
app.use(express.static(path.resolve(__dirname, './public')))

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, './views/login.html'))
})

app.get('/login', (req, res) => {
    fetch('http://localhost:3001/oauth/token', {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic YXBwbGljYXRpb24xOnNlY3JldDE='
        }
    }).then(res => res.json()).then(data => {
        console.log(data)
        res.redirect(`http://localhost:3001?access_token=${data.access_token}&templateId=temp1&state=1234567890`)
    })
})

app.get('/callback', (req, res) => {
    const token = req.query.data
    const data = jwt.verify(token, client.clientSecret)
    if (data.status === 'SUCCESS')
        res.render('index', data.msg)
    else
        res.send(data.msg)
})

app.listen(3000, function (event) {
    console.log('start')
})