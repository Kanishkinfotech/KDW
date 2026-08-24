module.exports = {
  apps: [{
    name: "kdw-backend",
    script: "./server/dist/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "1G",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    time: true
  }]
}
