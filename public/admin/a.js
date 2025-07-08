const apiUrl = "http://localhost:3000/admin"; // Update if needed

  
// Function to show section when a button is clicked
function checkAdminAccess() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
        alert("Access denied! Redirecting to Dashboard...");
        window.location.href = "/dashboard.html";  // Redirect non-admins
    }
}

// ✅ Call the function to verify admin access
checkAdminAccess();

function showSection(section) {
    const token = localStorage.getItem("token");
    fetch(`${apiUrl}/${section}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
             
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data || data.length === 0) {
            document.getElementById("content").innerHTML = `<p>No ${section} found.</p>`;
        } else {
            document.getElementById("content").innerHTML = generateTable(section, data);
        }
    })
    .catch(error => console.error(`Error loading ${section}:`, error));
}

function generateTable(section, data) {
    if (!data || data.length === 0) return `<p>No ${section} found.</p>`;

    let table = `<table border="1"><tr>`;

    // Headers
    Object.keys(data[0]).forEach(key => {
        table += `<th>${key}</th>`;
    });

    if (section === "order-status") {
        table += `<th>Update Status</th>`;
    } else {
        table += `<th>Actions</th>`;
    }

    table += `</tr>`;

    // Rows
    data.forEach(row => {
        table += `<tr>`;
        Object.entries(row).forEach(([key, value]) => {
            table += `<td>${value}</td>`;
        });

        // Determine the correct ID field based on the section
        let idField;
        switch (section) {
            case "users":
                idField = row.user_id;
                break;
            case "listings":
                idField = row.listing_id;
                break;
            case "orders":
                idField = row.order_id;
                break;
            case "reviews":
                idField = row.review_id;
                break;
            default:
                idField = null;
        }

        if (section === "order-status") {
            const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                .map(status =>
                    `<option value="${status}" ${status === row.status ? "selected" : ""}>${status}</option>`
                ).join("");

            table += `
                <td>
                    <select id="status-${row.status_id}">
                        ${statusOptions}
                    </select>
                    <button onclick="updateStatus(${row.status_id})">Save</button>
                </td>`;
        } else if (idField) {
            table += `<td><button onclick="deleteItem('${section}', '${idField}')">Delete</button></td>`;
        } else {
            table += `<td>No actions available</td>`;
        }

        table += `</tr>`;
    });

    table += `</table>`;
    return table;
}

function updateStatus(statusId) {
    const token = localStorage.getItem("token");
    const newStatus = document.getElementById(`status-${statusId}`).value;

    fetch(`${apiUrl}/order-status/${statusId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to update status");
        alert("Status updated!");
        showSection("order-status"); // Refresh the section
    })
    .catch(error => {
        console.error("Error updating status:", error);
        alert("Error updating status");
    });
}

// Function to delete a user/food listing/order/review
async function deleteItem(section, id) {
    if (!confirm(`Are you sure you want to delete this ${section}?`)) return;

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${apiUrl}/${section}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to delete");
        }

        alert(`${section} deleted successfully!`);
        showSection(section); // Refresh section after deletion

    } catch (error) {
        console.error(`Error deleting ${section}:`, error);
        alert("Error deleting item");
    }
}

function logout(){
    localStorage.removeItem("token");  // Remove token
    alert("Logged out successfully");
    window.location.href = "/login.html";  // Redirect to login page
}

// Add logout function to logout button
