document.getElementById("sellForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent default form submission

    const user = localStorage.getItem("user_id");
    if (!user) {
        alert("Please log in first!");
        window.location.href = "login.html";
        return;
    }

    const formData = new FormData();
    formData.append("user_id", user);
    formData.append("title", document.getElementById("title").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("quantity", document.getElementById("quantity").value);
    formData.append("expiry_date", document.getElementById("expiry_date").value);
    formData.append("image", document.getElementById("image").files[0]);

    try {
        const response = await fetch("http://localhost:3000/add-listing", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        console.log("Server Response: ", data);

        // ✅ Check if the message element exists before setting text
        const messageElement = document.getElementById("message");
        if (messageElement) {
            messageElement.innerText = data.message;
        }

        if (data.success) {
            alert("Listing added successfully!");
            window.location.href = "dashboard.html"; // Redirect after success
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("An error occurred. Please try again.");
    }
});
