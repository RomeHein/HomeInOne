module.exports = (res, err) => {
  if (process.env.node_env === 'development') {
    res.status(400).send(err)
  } else {
    res.sendStatus(400)
  }
  console.log('API error: ' + err)
}
