const path = require('path')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const URLSearchParams = require('url-search-params')
const jwt = require('jsonwebtoken')
const myInfoConfig = require('config').get('myInfo')

const app = express()
app.use(bodyParser.json())

const store = {}

app.get('/auth', (req, res) => {
    // TODO 调用需要的参数 id、timestamp、sign
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
            // TODO 是否需要加密
            res.redirect(`http://localhost:3000/info?text=${encodeURIComponent(text)}`)
        })
        .catch(e => {
            // TODO 重定向返回的状态码，错误处理
            res.send(e)
        })
})

app.listen(3001, function (event) {
    console.log('start')
})