const express = require('express');
const cors = require('cors');


const app = express();
const port = 4000;

app.use(cors());

// Existing endpoint to get transactions based on month
app.get('/transactions', (req, res) => {
  const { month } = req.query;
  const filteredTransactions = data.filter(
    (transaction) => transaction.dateOfSale.slice(5, 7) === month
  );
  res.json(filteredTransactions);
});

// New endpoint for statistics
app.get('/statistics', (req, res) => {
  const { month } = req.query;
  const filteredTransactions = data.filter(
    (transaction) => transaction.dateOfSale.slice(5, 7) === month
  );

  const totalSaleAmount = filteredTransactions.reduce(
    (total, transaction) => total + transaction.price,
    0
  );

  const totalSoldItems = filteredTransactions.filter(
    (transaction) => transaction.sold
  ).length;

  const totalNotSoldItems = filteredTransactions.filter(
    (transaction) => !transaction.sold
  ).length;

  res.json({
    totalSaleAmount,
    totalSoldItems,
    totalNotSoldItems,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
