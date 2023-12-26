const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors())

mongoose.connect('mongodb+srv://gchaitanya1419:Chaitanya14@cluster0.bpwbtja.mongodb.net/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productSchema = mongoose.Schema({
  title: { type: String },
  price: { type: Number },
  description: { type: String },
  image: { type: String },
  sold: { type: Boolean },
  dateOfSale: { type: String },
  category: { type: String },
});

const ProductModel = mongoose.model('product', productSchema);

// Initialize Database
app.get('/api/initialize-database', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    await ProductModel.insertMany(transactions);

    res.json({ message: 'Database initialized with seed data.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List All Transactions
app.get('/api/product', async (req, res) => {
  let { month } = req.query;
  const { search, page = 1, per_page = 10 } = req.query;

  if (month < 10) {
    month = `0${month}`;
  }

  let query = {
    dateOfSale: { $regex: `.*-${month}-.*` },
  };

  if (search == '') {
    query = query;
  } else if (!isNaN(search)) {
    query.$or = [{ price: parseFloat(search) }];
  } else {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const skip = (page - 1) * per_page;
    const record = await ProductModel.find(query);
    const result = await ProductModel.find(query).skip(skip).limit(per_page);
    res.status(200).send({ data: result, totalRecords: record?.length });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

// Statistics
app.get('/api/product/statistic', async (req, res) => {
  let { month } = req.query;

  try {
    if (month < 10) {
      month = `0${month}`;
    }

    const query = {
      dateOfSale: {
        $regex: `.*-${month}-.*`,
      },
    };

    const numOfSold = await ProductModel.find({ ...query, sold: true }).count();
    const numNotSold = await ProductModel.find({ ...query, sold: false }).count();

    const resultSold = await ProductModel.aggregate([
      {
        $match: {
          dateOfSale: {
            $regex: `.*-${month}-.*`,
          },
          sold: true,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$price',
          },
        },
      },
    ]);

    const resultNotSold = await ProductModel.aggregate([
      {
        $match: {
          dateOfSale: {
            $regex: `.*-${month}-.*`,
          },
          sold: false,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$price',
          },
        },
      },
    ]);

    res.status(200).send({
      totalSaleAmtOfMth: (+resultSold[0]?.total.toFixed(2)) + (+resultNotSold[0]?.total.toFixed(2)),
      totalSoldPerMonth: numOfSold,
      totalNotSoldPerMonth: numNotSold,
    });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

// Bar Chart
app.get('/api/product/chart', async (req, res) => {
  let { month } = req.query;

  try {
    if (month < 10) {
      month = `0${month}`;
    }

    const query = {
      dateOfSale: { $regex: `.*-${month}-.*` },
    };

    const result = await ProductModel.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$price', 100] }, then: '0-100' },
                { case: { $lte: ['$price', 200] }, then: '101-200' },
                { case: { $lte: ['$price', 300] }, then: '201-300' },
                { case: { $lte: ['$price', 400] }, then: '301-400' },
                { case: { $lte: ['$price', 500] }, then: '401-500' },
                { case: { $lte: ['$price', 600] }, then: '501-600' },
                { case: { $lte: ['$price', 700] }, then: '601-700' },
                { case: { $lte: ['$price', 800] }, then: '701-800' },
                { case: { $lte: ['$price', 900] }, then: '801-900' },
              ],
              default: '901-above',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const chartData = result.reduce((data, { _id, count }) => {
      data[_id] = count;
      return data;
    }, {});

    res.status(200).send({ total: chartData });
  } catch (err) {
    res.status(400).send({ err });
  }
});

// Pie Chart
app.get('/api/product/pie', async (req, res) => {
  let { month } = req.query;

  try {
    if (month < 10) {
      month = `0${month}`;
    }

    const query = {
      dateOfSale: { $regex: `.*-${month}-.*` },
    };

    const result = await ProductModel.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('Result:', result); // Add this line for debugging

    const chartData = result.reduce((data, { _id, count }) => {
      data[_id] = count;
      return data;
    }, {});

    console.log('ChartData:', chartData); // Add this line for debugging

    res.status(200).send({ total: chartData });
  } catch (err) {
    console.error(err); // Add this line for debugging
    res.status(400).send({ err });
  }
});


// Combined Response
app.get('/api/product/combinedResponse', async (req, res) => {
  let { month } = req.query;

  try {
    let respStat = await axios.get(`https://your-backend-url/api/product/statistic?month=${month}`);
    let respBar = await axios.get(`https://your-backend-url/api/product/chart?month=${month}`);
    let respPie = await axios.get(`https://your-backend-url/api/product/pie?month=${month}`);

    const combinedData = {
      statistic: respStat.data,
      chart: respBar.data,
      pie: respPie.data,
    };

    res.status(200).send(combinedData);
  } catch (err) {
    res.status(400).send({ err });
  }
});

app.listen(PORT, async () => {
  try {
    await mongoose.connection;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB');
  }

  console.log(`Server is running at http://localhost:${PORT}`);
});
