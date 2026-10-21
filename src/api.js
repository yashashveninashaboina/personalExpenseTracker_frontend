const API_URL = "http://localhost:8080/api/expenses";

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that Spring Boot is running."
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  return response.json();
}

export const expenseApi = {
  getAll(category = "") {
    const query = category
      ? `?category=${encodeURIComponent(category.toUpperCase())}`
      : "";

    return request(`${API_URL}${query}`);
  },

  getById(id) {
    return request(`${API_URL}/${id}`);
  },

  create(expense) {
    return request(API_URL, {
      method: "POST",
      body: JSON.stringify(expense),
    });
  },

  update(id, expense) {
    return request(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    });
  },

  delete(id) {
    return request(`${API_URL}/${id}`, {
      method: "DELETE",
    });
  },
};