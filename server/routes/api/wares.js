const express = require("express");
//TODO te būs jāizmanto mySQL DB imports un jāhandlo datu ielāde/dzēšana/update no DB

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Add get/post/delete methods here");
});

module.exports = router;
