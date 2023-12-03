import { useState, useEffect } from 'react';

import { BarChart, Bar, XAxis, YAxis,  PieChart, Pie, Tooltip, Legend, Sector, ResponsiveContainer, Cell } from 'recharts';


import './index.css';

const Table = () => {
  const [month, setMonth] = useState('03'); // Default to March
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    loadTransactions();
    loadStatistics(month); 
    loadBarChartData(month);
    loadPieChartData(month);

  }, [month, search, currentPage]); // Reload transactions when month, search, or currentPage changes

  


  const loadTransactions = () => {
    setLoading(true);
    fetch(`http://localhost:3000/api/transactions?month=${month}&search=${search}&page=${currentPage}`)
      .then(response => response.json())
      .then(data => {
        setTransactions(data.transactions);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  };


  const loadStatistics = () => {
    fetch(`http://localhost:3000/api/statistics?month=${month}`)
      .then(response => response.json())
      .then(data => {
        setStatistics(data);
      })
      .catch(error => {
        console.error(error);
      });
  };

  const displayMonthName = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  
    const selectedMonth = months[parseInt(month, 10) - 1];
    return selectedMonth;
  };

  
  const displayMonthOptions = () => {
    const months = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ];

    return months.map(month => (
      <option key={month.value} value={month.value}>
        {month.label}
      </option>
    ));
  };

  const displayTransactions = () => {
    return transactions.map(transaction => (
      <tr key={transaction.id}>
        <td>{transaction.id}</td>
        <td>{transaction.title}</td>
        <td>{transaction.description}</td>
        <td>{transaction.price}</td>
        <td>{transaction.category}</td>
        <td>{transaction.sold ? 'Yes' : 'No'}</td>
        <td>
          <img src={transaction.image} alt={transaction.title} style={{ width: '50px', height: '50px' }} />
        </td>
      </tr>
    ));
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to the first page when searching
    loadTransactions();
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next') {
      setCurrentPage(currentPage + 1);
    }

    loadTransactions();
  };

  //bargraph frontend

  const loadBarChartData = () => {
    fetch(`http://localhost:3000/api/bar-chart?month=${month}`)
      .then(response => response.json())
      .then(data => {
        setBarChartData(data.barChartData);
      })
      .catch(error => {
        console.error(error);
      });
  };

  const displayPriceBarChart = () => {
    return (
      <div className="statistics-card">
        <h2>Transactions Bar Chart for {displayMonthName()} </h2>
        <BarChart width={600} height={300} data={barChartData}>
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </div>
    );
  };

  // piechart front end

  const loadPieChartData = () => {
    fetch(`http://localhost:3000/api/pie-chart?month=${month}`)
      .then(response => response.json())
      .then(data => {
        setPieChartData(data.pieChartData);
      })
      .catch(error => {
        console.error(error);
      });
  };

  const displayCategoryPieChart = () => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666', '#99FF99', '#6666FF', '#FF9966', '#FFCC99'];

    return (
      <div className="statistics-card pie">
      
      <div className="PieChart" >
        <h2>Transactions Pie Chart for {displayMonthName()}  </h2>
        <PieChart width={400} height={400}>
          <Pie dataKey="count" data={pieChartData} cx={200} cy={200} outerRadius={80} fill="#8884d8" label>
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>

        <div>
          {pieChartData.map((entry, index) => (
            <div key={index} style={{ margin: '5px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: COLORS[index % COLORS.length] }}></div>
              <span style={{ marginLeft: '5px' }}>{entry.category}: {entry.count} items</span>
            </div>
          ))}
        </div>
      </div>
      </div>
    );
  };

 

  return (
    <div className="App">
      <h2>Transactions Table</h2>

      <label htmlFor="month">Select Month:</label>
      <select id="month" value={month} onChange={(e) => setMonth(e.target.value)}>
        {displayMonthOptions()}
      </select>

      <label htmlFor="search">Search:</label>
      <input type="text" id="search" value={search} onChange={(e) => setSearch(e.target.value)} />

      <button onClick={handleSearch}>Search</button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Price</th>
                <th>Category</th>
                <th>Sold</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>{displayTransactions()}</tbody>
          </table>

          <button onClick={() => handlePageChange('prev')}>Previous</button>
          <button onClick={() => handlePageChange('next')}>Next</button>

          <br/>

          <div className="statistics-card">
            <h3>Statistics for {displayMonthName()}</h3>
            <p>Total Sale Amount: ${statistics.totalSaleAmount}</p>
            <p>Total Sold Items: {statistics.totalSoldItems}</p>
            <p>Total Not Sold Items: {statistics.totalNotSoldItems}</p>
          </div>

          <div>
            
            {displayPriceBarChart()}
            {displayCategoryPieChart()}


            
          </div>
          
       
        </>
      )}
    </div>
  );
};

export default Table;
