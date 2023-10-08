const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();

//Middleware
app.use(bodyParser.json());
app.use(cors());

const products = require("./routes/api/products");
app.use("/api/products", products);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  console.log("Production routing");
  app.use(express.static(__dirname + "/public/"));
  app.get(/.*/, (req, res) => res.sendFile(__dirname + "/public/index.html"));
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
