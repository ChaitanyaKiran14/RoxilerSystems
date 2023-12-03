//backend logic to fetch 10 responses per page and did pagination

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// API to list all transactions with search and pagination
app.get('/api/transactions', async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 10 } = req.query;

    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Filter data based on the provided parameters
    const filteredTransactions = transactions
      .filter(transaction => new Date(transaction.dateOfSale).getMonth() === (new Date(month).getMonth()));

    // Apply search filter
    const searchRegex = new RegExp(search, 'i');
    const result = search
      ? filteredTransactions.filter(transaction =>
          transaction.title.match(searchRegex) ||
          transaction.description.match(searchRegex) ||
          transaction.price.toString().match(searchRegex)
        )
      : filteredTransactions;

    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedResult = result.slice(startIndex, endIndex);

    res.json({ transactions: paginatedResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// API endpoint for statistics

app.get('/api/statistics', async (req, res) => {
  try {
    const { month } = req.query;

    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions =  response.data;

    // Filter data based on the selected month
    const filteredTransactions = transactions
      .filter(transaction => new Date(transaction.dateOfSale).getMonth() === (new Date(month).getMonth()));

    // Calculate statistics
    const totalSaleAmount = filteredTransactions.reduce((total, transaction) => total + (transaction.sold ? transaction.price : 0), 0);
    const totalSoldItems = filteredTransactions.filter(transaction => transaction.sold).length;
    const totalNotSoldItems = filteredTransactions.filter(transaction => !transaction.sold).length;

    res.json({
      totalSaleAmount,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//bargraph end point

// Fetch transactions data from the third-party API

app.get('/api/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;

    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Filter data based on the provided month
    const filteredTransactions = transactions
      .filter(transaction => new Date(transaction.dateOfSale).getMonth() === (new Date(month).getMonth()));

    // Calculate price ranges and count items in each range
    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Number.MAX_SAFE_INTEGER } // Above 900
    ];

    const barChartData = priceRanges.map(range => {
      const itemsInRange = filteredTransactions.filter(transaction =>
        transaction.price >= range.min && transaction.price <= range.max
      );
      return {
        range: `${range.min}-${range.max}`,
        count: itemsInRange.length
      };
    });

    res.json({ barChartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//pie chart statistics

app.get('/api/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;

    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Filter data based on the provided month
    const filteredTransactions = transactions
      .filter(transaction => new Date(transaction.dateOfSale).getMonth() === (new Date(month).getMonth()));

    // Calculate unique categories and count items in each category
    const categoryCount = {};
    filteredTransactions.forEach(transaction => {
      if (categoryCount[transaction.category]) {
        categoryCount[transaction.category]++;
      } else {
        categoryCount[transaction.category] = 1;
      }
    });

    const pieChartData = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    }));

    res.json({ pieChartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});