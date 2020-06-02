const mongoose = require("mongoose");
const config = require("./config/config");
const GetPolkaData = require("./lib/GetPolkaData");
const app = require('./routes/app');

// TODO: move to database.js
mongoose
  .connect(config.dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("connected to database"))
  .catch(() => console.log("database failed to connect"));


async function main() {
  const getPolkaData = new GetPolkaData(config);
  getPolkaData.runCrawlers();
}

main().catch((error) => {
  console.error(error);
});

// Start the server
const port = config.PORT;
app.listen(port, () => {
    console.log(`Application is running on port ${port}`);
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION!!!  shutting down ...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});