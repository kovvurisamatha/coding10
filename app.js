const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dbpath = path.join(__dirname, 'covid19IndiaPortal.db')
let db = null
const initialandstartdb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('app running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('db error:${e.message}')
    process.exit(1)
  }
}
initialandstartdb()
module.exports = app
//api1
let jwttoken
const authenticatetoken = (request, response, next) => {
  const authheader = request.headers['authorization']
  if (authheader !== undefined) {
    jwttoken = authheader.split(' ')[1]
  }
  if (jwttoken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwttoken, 'samatha', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid TWT Token')
      } else {
        next()
      }
    })
  }
}
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectuser = `select * from user
  where username='${username}'`
  dbuser = await db.get(selectuser)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispasswordmatched = await bcrypt.compare(password, dbuser.password)
    if (ispasswordmatched === true) {
      const payload = {
        username: username,
      }
      const jwttoken = jwt.sign(payload, 'samatha')
      response.send({jwttoken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
//api2
const convertintoobject = dbobject => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.statename,
    population: dbobject.population,
  }
}
app.get('/states', async (request, response) => {
  const getstates = `select * from state`
  getstateresponse = await db.all(getstates)
  response.send(getstateresponse.map(eachstate => convertintoobject(eachstate)))
})
//api3
app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getstate = `select * from state where state_id=${stateId}`
  const getstateresponse = await db.get(getstate)
  response.send(convertintoobject(getstateresponse))
})
