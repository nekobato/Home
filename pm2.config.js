module.exports = {
  apps : [{
    name   : "davneko",
    script : "/Users/nekobato/app/davneko/backend/dist/server.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 3030
    }
  }]
}
