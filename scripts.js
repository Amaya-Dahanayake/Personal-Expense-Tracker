(function () {
  "use strict";

  var STORAGE_KEY = "personalExpenseTracker.transactions";

  var form = document.getElementById("transactionForm");
  var typeEl = document.getElementById("type");
  var descEl = document.getElementById("description");
  var amountEl = document.getElementById("amount");
  var categoryEl = document.getElementById("category");
  var dateEl = document.getElementById("date");
  var clearBtn = document.getElementById("clearBtn");
  var filterEl = document.getElementById("filter");
  var searchEl = document.getElementById("search");
  var bodyEl = document.getElementById("transactionBody");
  var incomeEl = document.getElementById("totalIncome");
  var expensesEl = document.getElementById("totalExpenses");
  var balanceEl = document.getElementById("currentBalance");

  var transactions = load();

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      alert("Could not save to browser storage.");
    }
  }

  function formatLKR(n) {
    return "LKR " + n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function setError(input, errorId, message) {
    document.getElementById(errorId).textContent = message;
    input.classList.toggle("invalid", Boolean(message));
  }

  function validate() {
    var ok = true;

    if (descEl.value.trim() === "") {
      setError(descEl, "descriptionError", "Enter a description.");
      ok = false;
    } else {
      setError(descEl, "descriptionError", "");
    }

    var amount = parseFloat(amountEl.value);
    if (isNaN(amount) || amount <= 0) {
      setError(amountEl, "amountError", "Enter an amount greater than 0.");
      ok = false;
    } else {
      setError(amountEl, "amountError", "");
    }

    if (categoryEl.value === "") {
      setError(categoryEl, "categoryError", "Select a category.");
      ok = false;
    } else {
      setError(categoryEl, "categoryError", "");
    }

    if (dateEl.value === "") {
      setError(dateEl, "dateError", "Select a date.");
      ok = false;
    } else {
      setError(dateEl, "dateError", "");
    }

    return ok;
  }

  function clearErrors() {
    setError(descEl, "descriptionError", "");
    setError(amountEl, "amountError", "");
    setError(categoryEl, "categoryError", "");
    setError(dateEl, "dateError", "");
  }

  function updateTotals() {
    var income = 0;
    var expenses = 0;

    transactions.forEach(function (t) {
      if (t.type === "income") income += t.amount;
      else expenses += t.amount;
    });

    var balance = income - expenses;
    incomeEl.textContent = formatLKR(income);
    expensesEl.textContent = formatLKR(expenses);
    balanceEl.textContent = formatLKR(balance);
    balanceEl.classList.toggle("negative", balance < 0);
  }

  function getVisible() {
    var filter = filterEl.value;
    var q = searchEl.value.trim().toLowerCase();

    return transactions.filter(function (t) {
      var typeOk = filter === "all" || t.type === filter;
      var searchOk =
        q === "" ||
        t.description.toLowerCase().indexOf(q) !== -1 ||
        t.category.toLowerCase().indexOf(q) !== -1;
      return typeOk && searchOk;
    });
  }

  function renderTable() {
    var rows = getVisible();

    if (rows.length === 0) {
      bodyEl.innerHTML = '<tr><td colspan="6" class="empty">No transactions found.</td></tr>';
      return;
    }

    bodyEl.innerHTML = rows.map(function (t) {
      var isIncome = t.type === "income";
      var sign = isIncome ? "+" : "\u2212";
      return (
        "<tr>" +
          "<td>" + escapeHTML(t.date) + "</td>" +
          "<td>" + escapeHTML(t.description) + "</td>" +
          '<td><span class="badge badge-' + t.type + '">' + (isIncome ? "income" : "expense") + "</span></td>" +
          "<td>" + escapeHTML(t.category) + "</td>" +
          '<td class="num amount-' + t.type + '">' + sign + " " + formatLKR(t.amount) + "</td>" +
          '<td><button type="button" class="btn btn-delete" data-id="' + t.id + '">Delete</button></td>' +
        "</tr>"
      );
    }).join("");
  }

  function render() {
    updateTotals();
    renderTable();
  }

  function resetForm() {
    form.reset();
    dateEl.value = todayISO();
    clearErrors();
  }

  function addTransaction(e) {
    e.preventDefault();
    if (!validate()) return;

    transactions.push({
      id: newId(),
      type: typeEl.value,
      description: descEl.value.trim(),
      amount: parseFloat(amountEl.value),
      category: categoryEl.value,
      date: dateEl.value
    });

    save();
    render();
    resetForm();
    alert("Transaction added successfully!");
  }

  function deleteTransaction(id) {
    if (!confirm("Delete this transaction?")) return;
    transactions = transactions.filter(function (t) { return t.id !== id; });
    save();
    render();
  }

  form.addEventListener("submit", addTransaction);
  clearBtn.addEventListener("click", resetForm);
  filterEl.addEventListener("change", renderTable);
  searchEl.addEventListener("input", renderTable);

  bodyEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".btn-delete");
    if (btn) deleteTransaction(btn.getAttribute("data-id"));
  });

  dateEl.value = todayISO();
  render();
})();