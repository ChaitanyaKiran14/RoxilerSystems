import { useState, useEffect } from 'react';
import './index.css';

const Table = () =>  {
  const [month, setMonth] = useState('03'); // Default to March
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTransactions();
  }, [month, search, currentPage]); // Reload transactions when month, search, or currentPage changes

  const loadTransactions = () => {
    fetch(`http://localhost:3000/api/transactions?month=${month}&search=${search}&page=${currentPage}`)
      .then(response => response.json())
      .then(data => setTransactions(data.transactions))
      .catch(error => console.error(error));
  };

  const displayTransactions = () => {
    return transactions.map(transaction => (
      <tr key={transaction.id}>
        <td>{transaction.title}</td>
        <td>{transaction.description}</td>
        <td>{transaction.price}</td>
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

  return (
    <div className="App">
      <h2>Transactions Table</h2>

      <label htmlFor="month">Select Month:</label>
      <select id="month" value={month} onChange={(e) => setMonth(e.target.value)}>
        {/* Add month options here */}
      </select>

      <label htmlFor="search">Search:</label>
      <input type="text" id="search" value={search} onChange={(e) => setSearch(e.target.value)} />

      <button onClick={handleSearch}>Search</button>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>{displayTransactions()}</tbody>
      </table>

      <button onClick={() => handlePageChange('prev')}>Previous</button>
      <button onClick={() => handlePageChange('next')}>Next</button>
    </div>
  );
}

export default Table
