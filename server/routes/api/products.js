const express = require("express");
const axios = require("axios");
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const router = express.Router();
const warehouseUrl = process.env.WAREHOUSE_API_URL;

//get all products from store DB. Contains: id, description, name, price, amount, sku
router.get("/all", async (req, res) => {
  try {
    const sql = "SELECT * from products";
    connection.query(sql, function (error, results) {
      console.log("DB connection state: " + connection.state);

      if (error) {
        res.send({ success: false });

        return;
      }

      res.send({ success: true, results });
    });
  } catch (error) {
    res.send({ success: false });
  }
});

//get one specific product from warehouse system by sku to check available amount
router.post("/product", async (req, res) => {
  try {
    console.log("Fetching product from warehouse system.");

    const sku = req.query.sku;
    const results = await axios.get(warehouseUrl + "/product", {
      params: { sku },
    });

    const sql = "UPDATE products SET amount = ? WHERE sku = ?";

    const productData = results.data.results.find(
      (product) => product?.sku === sku
    );
    if (productData) {
      connection.query(
        sql,
        [productData.amount, productData.sku],
        function (error, results) {
          if (error) {
            res.send({ success: false });

            return;
          }
        }
      );

      res.send({ success: true, amount: String(productData.amount) });
    }
  } catch (error) {
    res.send({ success: false });
  }
});

//delete all products from store DB
router.delete("/products", async (req, res) => {
  try {
    const sql = "TRUNCATE TABLE Products;";
    connection.query(sql, function (error, results) {
      if (error) {
        res.send({ success: false, message: "Could not delete all products" });

        return;
      }

      res.send({ success: true });
    });
  } catch (error) {
    res.send({ success: false, message: "Could not delete all products" });
  }
});

//get all products from warehouse
router.post("/products", async (req, res) => {
  try {
    console.log("Fetching all products from warehouse system.");

    const results = await axios.get(warehouseUrl + "/products");

    const sql = "TRUNCATE TABLE Products;";
    connection.query(sql, function (error, results) {
      if (error) {
        res.send({ success: false, message: "Could not update all products" });

        return;
      }
    });

    results.data.results.forEach((product) => {
      const sql =
        "INSERT INTO products (description, name, price, amount, sku) VALUES (?, ?, ?, ?, ?)";
      const sqlParams = [
        product.description,
        product.name,
        product.price,
        product.amount,
        product.sku,
      ];

      connection.query(sql, sqlParams, function (error, results) {
        if (error) {
          res.send({
            success: false,
            message: "Could not update all products",
          });

          return;
        }
      });
    });

    res.send({ success: true });
  } catch (error) {
    res.send({ success: false, message: "Could not update all products" });
  }
});

//'buy' product. Basically reduces its amount in DB and sends info also to warehouse
router.post("/buy", async (req, res) => {
  const sku = req.query.sku;
  const amount = req.query.amount;

  try {
    await axios.post(warehouseUrl + "/updateAmount", null, {
      params: { sku, amount },
    });
  } catch (error) {
    //updating warehouse DB is important as it contains the correct amount of products
    res.send({ success: false });
    return;
  }

  try {
    const sql = "UPDATE products SET amount = (amount - ?) WHERE sku = ?";
    connection.query(sql, [amount, sku], function (error, results) {
      if (error) {
        res.send({ success: false });

        return;
      }

      res.send({ success: true });
    });
  } catch (error) {
    res.send({ success: false });
  }
});

module.exports = router;
