const { createClient } = require("redis");
const client = createClient({
    url: "redis://localhost:6379"
});

client.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
    await client.connect();
    console.log("Redis Connected");
})();

module.exports = client;