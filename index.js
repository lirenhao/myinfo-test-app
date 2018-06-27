const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const express = require('express')
const config = require('config')
const fetch = require('node-fetch')
const URLSearchParams = require('url-search-params')
const jwt = require('jsonwebtoken')

const app = express()

const myInfoConfig = config.get('myInfo')

app.set('views', path.resolve(__dirname, './views'))
app.set('view engine', 'jade')

app.use(bodyParser.json())
app.use(express.static(path.resolve(__dirname, './public')))

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, './views/login.html'))
})

app.get('/login', (req, res) => {
    const purpose = 'demonstrating MyInfo APIs'
    const state = 123

    const authoriseUrl = myInfoConfig.authApiUrl
        + "?client_id=" + myInfoConfig.clientId
        + "&attributes=" + myInfoConfig.attributes
        + "&purpose=" + purpose
        + "&state=" + state
        + "&redirect_uri=" + myInfoConfig.redirectUrl;

    res.redirect(authoriseUrl)
})

function verifyJWS(jws) {
    const cert = fs.readFileSync(path.resolve(__dirname, myInfoConfig.publicKey))
    return jwt.verify(jws, cert, {algorithms: ['RS256'], ignoreNotBefore: true});
}

app.get('/callback', (req, res) => {
    const data = req.query
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('code', data.code)
    params.append('redirect_uri', myInfoConfig.redirectUrl)
    params.append('client_id', myInfoConfig.clientId)
    params.append('client_secret', myInfoConfig.clientSecret)

    fetch(myInfoConfig.tokenApiUrl, {method: 'POST', body: params})
        .then(res => new Promise(async (resolve, reject) => {
            if (res.status === 200) {
                resolve(await res.json())
            } else {
                reject(await res.text())
            }
        }))
        .then(json => {
            console.log(json.access_token)
            const token = verifyJWS(json.access_token)
            const url = `${myInfoConfig.personApiUrl}/${token.sub}/?client_id=${myInfoConfig.clientId}&attributes=${myInfoConfig.attributes}`
            return fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${json.access_token}`,
                }
            })
        })
        .then(res => res.text())
        .then(text => {
            // const data = verifyJWS(text)
            // S9812381D MyInfo2o15
            res.render('index', JSON.parse(text))
        })
        .catch(e => {
            res.send(e)
        })
})

app.get('/token', (req, res) => {
    console.log('token')
    res.end()
})

app.listen(3001, function (event) {
    console.log('start')
})