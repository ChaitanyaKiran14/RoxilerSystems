//backend logic to fetch only 5 values per page and did pagination

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// API to list all transactions with search and pagination
app.get('/api/transactions', async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 5 } = req.query;

    // Fetch data from the third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Filter data based on the provided parameters
    const filteredTransactions = transactions.filter(
      (transaction) => new Date(transaction.dateOfSale).getMonth() + 1 === parseInt(month)
    );

    // Apply search filter
    const searchRegex = new RegExp(search, 'i');
    const result = search
      ? filteredTransactions.filter(
          (transaction) =>
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
