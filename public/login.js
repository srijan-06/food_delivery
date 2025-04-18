document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        // ✅ Fix: Ensure valid response before processing
        const data = await response.json();

        if (response.ok) {
            if (!data.token || !data.role) {
                throw new Error("Token or role missing from response.");
            }

            localStorage.setItem("token", data.token);  
            localStorage.setItem("role", data.role);    
            localStorage.setItem("user_id",data.user_id);

            alert("Login successful");

            // ✅ Redirect based on role
            if (data.role === "admin") {
                window.location.href = "/admin/index.html";  
            } else {
                window.location.href = "/dashboard.html";  
            }
        } else {
            alert("Login failed: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred while logging in.");
    }
});
