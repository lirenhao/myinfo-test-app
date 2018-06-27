const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()

app.use(bodyParser.json())
app.use(express.static(path.resolve(__dirname, './public')))

app.set('views', path.resolve(__dirname, './views'))
app.set('view engine', 'jade')

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, './views/client.html'))
})

app.get('/info', (req, res) => {
    const query = req.query
    res.render('index', JSON.parse(query.text))
})

app.listen(3000, function (event) {
    console.log('start')
})