document.getElementById("signupForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const city = document.getElementById("city").value;

    const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, address, city }),
    });

    const data = await response.json();
    if (response.ok) {
        alert("Signup Successful! Redirecting to login...");
        window.location.href = "login.html"; // Redirect to login page
    } else {
        alert(`Signup Failed: ${data.error}`);
    }
});
