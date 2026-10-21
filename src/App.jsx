
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Receipt,
  TrendingUp,
  CalendarDays,
  X,
  RefreshCw,
} from "lucide-react";
import { expenseApi } from "./api";

const CATEGORIES = ["Food", "Travel", "Shopping", "Other"];

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "Food",
  date: new Date().toLocaleDateString("en-CA"),
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await expenseApi.getAll();
      setExpenses(data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const total = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      ),
    [expenses]
  );

  const filteredExpenses = useMemo(
    () =>
      filter === "All"
        ? expenses
        : expenses.filter(
            (expense) => expense.category === filter.toUpperCase()
          ),
    [expenses, filter]
  );

  function notify(message, type = "success") {
    setNotice({ message, type });
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title) {
      notify("Please enter an expense title.", "error");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Amount must be greater than zero.", "error");
      return;
    }

    if (!form.date) {
      notify("Please select a date.", "error");
      return;
    }

    const payload = {
      title,
      amount: amount.toFixed(2),
      category: form.category.toUpperCase(),
      date: form.date,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await expenseApi.update(editingId, payload);
        notify("Expense updated successfully.");
      } else {
        await expenseApi.create(payload);
        notify("Expense added successfully.");
      }

      resetForm();
      await loadExpenses();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category.toLowerCase()
        .replace(/^./, (letter) => letter.toUpperCase()),
      date: expense.date,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(expense) {
    const confirmed = window.confirm(
      `Delete "${expense.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await expenseApi.delete(expense.id);

      if (editingId === expense.id) resetForm();

      notify("Expense deleted successfully.");
      await loadExpenses();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Expense tracker home">
          <span className="brand-icon"><Wallet size={23} /></span>
          <span>SpendWise</span>
        </a>
        <span className="topbar-label">PERSONAL FINANCE</span>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
            <h1>Personal Expense Tracker</h1>
            <p className="subtitle">
              Track your daily spending, one expense at a time.
            </p>
          </div>
          <div className="heading-icon"><Receipt size={26} /></div>
        </div>

        {notice && (
          <div
            className={`notice ${notice.type}`}
            role="status"
            aria-live="polite"
          >
            <span>{notice.message}</span>
            <button
              className="icon-button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="summary-grid">
          <article className="summary-card total-card">
            <div className="summary-top">
              <span>Total spending</span>
              <span className="summary-icon purple"><Wallet size={20} /></span>
            </div>
            <strong>{money(total)}</strong>
            <p>Across all saved expenses</p>
          </article>

          <article className="summary-card">
            <div className="summary-top">
              <span>Total transactions</span>
              <span className="summary-icon green"><Receipt size={20} /></span>
            </div>
            <strong>{expenses.length}</strong>
            <p>Saved expense records</p>
          </article>

          <article className="summary-card">
            <div className="summary-top">
              <span>Average expense</span>
              <span className="summary-icon orange">
                <TrendingUp size={20} />
              </span>
            </div>
            <strong>
              {money(expenses.length ? total / expenses.length : 0)}
            </strong>
            <p>Per transaction</p>
          </article>
        </section>

        <section className="panel form-panel">
          <div className="panel-heading">
            <div className="section-icon"><Plus size={19} /></div>
            <div>
              <h2>{editingId !== null ? "Edit expense" : "Add new expense"}</h2>
              <p>Enter the details of your transaction below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Expense title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. Lunch with friends"
                  maxLength={255}
                  required
                />
              </label>

              <label className="field">
                <span>Amount (₹)</span>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={updateField}
                  placeholder="e.g. 250.00"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  required
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={updateField}
                  required
                />
              </label>
            </div>

            <div className="form-actions">
              {editingId !== null && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                <Plus size={17} />
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Add expense"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel expenses-panel">
          <div className="list-heading">
            <div>
              <h2>Recent expenses</h2>
              <p>Review and manage your transactions.</p>
            </div>

            <label className="filter-control">
              <Filter size={16} />
              <select
                aria-label="Filter expenses by category"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadError && (
            <div className="load-error" role="alert">
              <p>{loadError}</p>
              <button
                className="button secondary"
                onClick={loadExpenses}
              >
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              Loading your expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CalendarDays size={27} /></div>
              <h3>No expenses found</h3>
              <p>
                {expenses.length === 0
                  ? "Add your first expense using the form above."
                  : "Try selecting a different category."}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th className="amount-cell">Amount</th>
                    <th className="action-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="expense-title">
                          <span className="expense-dot" />
                          <span>{expense.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`category-badge ${expense.category.toLowerCase()}`}>
                          {expense.category.charAt(0) +
                            expense.category.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="date-cell">{expense.date}</td>
                      <td className="amount-cell">
                        <strong>{money(expense.amount)}</strong>
                      </td>
                      <td className="action-cell">
                        <button
                          className="icon-button edit-button"
                          title="Edit expense"
                          aria-label={`Edit ${expense.title}`}
                          onClick={() => startEdit(expense)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button delete-button"
                          title="Delete expense"
                          aria-label={`Delete ${expense.title}`}
                          onClick={() => handleDelete(expense)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-footer">
            Showing {filteredExpenses.length} of {expenses.length} expenses
            {filter !== "All" && ` · ${filter}`}
          </div>
        </section>

        <footer className="footer">
          <Wallet size={15} />
          <span>SpendWise · Make every expense count.</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
