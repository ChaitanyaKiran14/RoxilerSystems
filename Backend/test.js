const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Connect to MongoDB (replace 'your_mongodb_connection_string' with your actual MongoDB connection string)
mongoose.connect('mongodb+srv://gchaitanya1419:Chaitanya14@cluster0.bpwbtja.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create MongoDB Schema
const transactionSchema = mongoose.Schema(
    {
        title: {type:String},
        price: {type:Number},
        description: {type:String},
        image: {type:String},
        sold: {type:Boolean},
        dateOfSale: {type:String}
    }
)
  
  
const Transaction = mongoose.model('Transaction', transactionSchema);

app.use(bodyParser.json());

// Initialize Database with Seed Data
app.get('/api/initialize-database', async (req, res) => {
  try {
    // Fetch JSON from the third-party API (replace 'your_third_party_api_url' with the actual URL)
    const response = await fetch('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = await response.json();

    // Insert data into MongoDB
    await Transaction.insertMany(data);

    res.json({ success: true, message: 'Database initialized with seed data.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error initializing database.' });
  }
});

// API to list all transactions with search and pagination
app.get('/api/transactions', async (req, res) => {
    try {
      const { month, search, page = 1, perPage = 10 } = req.query;
  
      // Calculate the start and end dates for the month
      const startDate = new Date(`2022-${month}-01T00:00:00Z`);
      const endDate = new Date(`2022-${month + 1}-01T00:00:00Z`);
  
      const filter = {
        dateOfSale: { $gte: startDate, $lt: endDate },
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { price: { $regex: search, $options: 'i' } },
        ],
      };
  
      const transactions = await Transaction.find(filter)
        .skip((page - 1) * perPage)
        .limit(parseInt(perPage));
  
      res.json({ transactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error fetching transactions.' });
    }
});
  
  

// API for statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const { month } = req.query;

    const totalSaleAmount = await Transaction.aggregate([
      { $match: { dateOfSale: { $regex: new RegExp(`-${month}-`), $options: 'i' } } },
      { $group: { _id: null, totalSaleAmount: { $sum: '$price' } } },
    ]);

    const totalSoldItems = await Transaction.countDocuments({
      sold: true,
      dateOfSale: { $regex: new RegExp(`-${month}-`), $options: 'i' },
    });

    const totalNotSoldItems = await Transaction.countDocuments({
      sold: false,
      dateOfSale: { $regex: new RegExp(`-${month}-`), $options: 'i' },
    });

    res.json({ totalSaleAmount: totalSaleAmount[0]?.totalSaleAmount || 0, totalSoldItems, totalNotSoldItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching statistics.' });
  }
});

// API for bar chart
app.get('/api/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;

    const barChartData = await Transaction.aggregate([
      { $match: { dateOfSale: { $regex: new RegExp(`-${month}-`), $options: 'i' } } },
      {
        $group: {
          _id: { $subtract: [{ $floor: { $divide: ['$price', 100] } }, { $mod: [{ $floor: { $divide: ['$price', 100] } }, 10] }] },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ barChartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching bar chart data.' });
  }
});

// API for pie chart
app.get('/api/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;

    const pieChartData = await Transaction.aggregate([
      { $match: { dateOfSale: { $regex: new RegExp(`-${month}-`), $options: 'i' } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ pieChartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching pie chart data.' });
  }
});

// API to fetch combined data from all APIs
app.get('/api/combined-data', async (req, res) => {
  try {
    const { month } = req.query;

    const transactions = await fetch(`http://localhost:${PORT}/api/transactions?month=${month}`);
    const statistics = await fetch(`http://localhost:${PORT}/api/statistics?month=${month}`);
    const barChartData = await fetch(`http://localhost:${PORT}/api/bar-chart?month=${month}`);
    const pieChartData = await fetch(`http://localhost:${PORT}/api/pie-chart?month=${month}`);

    const [transactionsData, statisticsData, barChartDataData, pieChartDataData] = await Promise.all([
      transactions.json(),
      statistics.json(),
      barChartData.json(),
      pieChartData.json(),
    ]);

    res.json({
      transactions: transactionsData.transactions,
      statistics: statisticsData,
      barChartData: barChartDataData.barChartData,
      pieChartData: pieChartDataData.pieChartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching combined data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
