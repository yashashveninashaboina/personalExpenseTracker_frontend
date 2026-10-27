import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const API = "http://localhost:8080/api/expenses";

  const [expenses, setExpenses] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const [editId, setEditId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [message, setMessage] = useState("");

  // Load expenses when the page opens
  useEffect(() => {
    getExpenses();
  }, []);

  // Get all expenses from backend
  function getExpenses() {
    fetch(API)
      .then((response) => response.json())
      .then((data) => {
        setExpenses(data);
      })
      .catch(() => {
        setMessage("Cannot connect to backend");
      });
  }

  // Add or update an expense
  function handleSubmit(event) {
    event.preventDefault();

    if (title.trim() === "") {
      setMessage("Title cannot be empty");
      return;
    }

    if (amount === "" || Number(amount) <= 0) {
      setMessage("Amount must be greater than zero");
      return;
    }

    if (date === "") {
      setMessage("Please select a date");
      return;
    }

    const expense = {
      title: title.trim(),
      amount: Number(amount),
      category: category,
      date: date,
    };

    let url = API;
    let method = "POST";

    if (editId !== null) {
      url = API + "/" + editId;
      method = "PUT";
    }

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    })
      .then((response) => response.text())
      .then((data) => {
        if (
          data === "Title cannot be empty" ||
          data === "Amount must be greater than zero" ||
          data === "Please select a category" ||
          data === "Please select a date" ||
          data === "Expense not found"
        ) {
          setMessage(data);
          return;
        }

        setMessage(data);

        setTitle("");
        setAmount("");
        setCategory("Food");
        setDate("");
        setEditId(null);

        getExpenses();
      })
      .catch(() => {
        setMessage("Something went wrong");
      });
  }

  // Fill the form for editing
  function editExpense(expense) {
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDate(expense.date);
    setEditId(expense.id);
    setMessage("");
  }

  // Delete an expense
  function deleteExpense(id) {
    if (!window.confirm("Do you want to delete this expense?")) {
      return;
    }

    fetch(API + "/" + id, {
      method: "DELETE",
    })
      .then((response) => response.text())
      .then((data) => {
        setMessage(data);

        if (editId === id) {
          cancelEdit();
        }

        getExpenses();
      })
      .catch(() => {
        setMessage("Could not delete expense");
      });
  }

  // Cancel editing
  function cancelEdit() {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate("");
    setEditId(null);
    setMessage("");
  }

  // Filter expenses by category
  const filteredExpenses = expenses.filter((expense) => {
    if (filterCategory === "All") {
      return true;
    }

    return expense.category === filterCategory;
  });

  // Calculate total spending across ALL expenses
  const totalAmount = expenses.reduce((total, expense) => {
    return total + Number(expense.amount);
  }, 0);

  return (
    <div className="container">
      <header>
        <h1>Personal Expense Tracker</h1>
        <p>Keep track of your everyday spending.</p>
      </header>

      <div className="total-card">
        <p>Total Amount Spent</p>
        <h2>₹{totalAmount.toFixed(2)}</h2>
      </div>

      <h2>{editId === null ? "Add Expense" : "Edit Expense"}</h2>

      <form onSubmit={handleSubmit}>
        <label>Expense Title</label>
        <input
          type="text"
          placeholder="e.g. Lunch"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Amount (₹)</label>
        <input
          type="number"
          placeholder="Enter amount"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">Shopping</option>
          <option value="Other">Other</option>
        </select>

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <button type="submit">
          {editId === null ? "Add Expense" : "Update Expense"}
        </button>

        {editId !== null && (
          <button type="button" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <p className="message">{message}</p>

      <div className="list-heading">
        <h2>Expense History</h2>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">Shopping</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {filteredExpenses.length === 0 ? (
        <p className="empty">No expenses found.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.title}</td>
                  <td>₹{Number(expense.amount).toFixed(2)}</td>
                  <td>{expense.category}</td>
                  <td>{expense.date}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => editExpense(expense)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
