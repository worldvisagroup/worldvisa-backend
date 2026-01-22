require("dotenv").config();
const axios = require("axios");

const getCurrency = async (req, res) => {
  try {
    const fetchExchangeRate = await axios.get(
      `${process.env.EXCHANGE_RATE_URL}/${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`
    );

    res.send({ data: fetchExchangeRate.data });
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
};

module.exports = {
  getCurrency,
};
