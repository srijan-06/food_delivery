const express = require("express");
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cors = require('cors');
const path = require('path');
const multer = require("multer");  
const app = express();
const fs = require("fs");
app.use(express.json());
const adminRoutes = require("./routes/admin");
const adminAuth = require("./middlewares/adminAuth");
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cors());
app.use(express.static('public')); // Serve frontend files
app.use(express.urlencoded({ extended: true }));
app.use("/admin", adminRoutes);
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir,{recursive : true});
}
// Database Connection
const connection =mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your MySQL password if any
    database: 'food'
});

connection.connect((err) => {
    if (err) console.error('❌ Database connection failed:', err);
    else console.log('✅ Database connected');
});
function authenticateToken(req, res, next) {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });

    try {
        const verified = jwt.verify(token.split(" ")[1], "your_secret_key");
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid token" });
    }
}

// Register User
app.post('/api/register', async (req, res) => {
    const { name, email, password, phone, address, city } = req.body;
    if (!name || !email || !password || !phone || !address || !city) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email or phone number already exists
    connection.query(
        'SELECT email, phone FROM users WHERE email = ? OR phone = ?',
        [email, phone],
        async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length > 0) {
                const existingUser = results[0];

                // Determine if email or phone already exists
                if (existingUser.email === email) {
                    return res.status(400).json({ error: "Email already exists" });
                }
                if (existingUser.phone === phone) {
                    return res.status(400).json({ error: "Mobile number already exists" });
                }
                return res.status(400).json({ error: "Email or Mobile number already exists" });
            }

            // Hash password and insert into database
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                connection.query(
                    'INSERT INTO users (NAME, email, password_hash, phone, address, city, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [name, email, hashedPassword, phone, address, city],
                    (err, results) => {
                        if (err) {
                            console.error("Database error:", err);
                            return res.status(500).json({ error: "Database error" });
                        }
                        res.json({ message: "User registered successfully" });
                    }
                );
            } catch (err) {
                console.error("Password hashing error:", err);
                res.status(500).json({ error: "Error hashing password" });
            }
        }
    );
});


// Login User
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    console.log("🔹 Login attempt for:", email);

    connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            console.log("❌ User not found:", email);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = results[0];
        console.log("🔹 User found:", user.email, "Role:", user.role);

        if (!user.password_hash) {
            console.error("❌ Password is undefined for:", email);
            return res.status(500).json({ error: "Server error - password missing" });
        }

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                console.error("❌ bcrypt Error:", err);
                return res.status(500).json({ error: "Server error" });
            }

            if (!isMatch) {
                console.log("❌ Incorrect password for:", email);
                return res.status(401).json({ error: "Incorrect password" });
            }

            // ✅ Fix: Ensure role is always defined
            const role = user.role || "user"; 

            const token = jwt.sign({ id: user.user_id, role: role }, "your_secret_key", { expiresIn: "1h" });

            console.log("✅ Login successful for:", email);
            return res.json({
                message: "Login successful",
                token: token,  
                user_id: user.user_id, 
                email: user.email, 
                role: role     
            });
        });
    });
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"), // Store in `uploads/` folder
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) // Unique filename
});

const upload = multer({ storage: storage });
app.post("/add-listing", upload.single("image"), (req, res) => {
    const { title, description, price, quantity, expiry_date, user_id } = req.body;
    const image_url = req.file ? "/uploads/" + req.file.filename : null;
    
    if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID is required!" });
    }

    const sql = "INSERT INTO foodlistings (user_id, title, description, price, quantity, expiry_date, image_url,int_qnt) VALUES (?, ?, ?, ?, ?, ?, ?,?) ";
    connection.query(sql, [user_id, title, description, price, quantity, expiry_date, image_url,quantity], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error!" });
        }
      
        res.json({ success: true, message: "Listing added successfully!" });
    });
});
app.post("/api/reviews", (req, res) => {
  const { reviewer_id, seller_id, comment, rating } = req.body;

  if (!reviewer_id || !seller_id || !comment || !rating) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const query = `
    INSERT INTO reviews (reviewer_id, seller_id, rating, comment, review_date)
    VALUES (?, ?, ?, ?, NOW())
  `;

  connection.query(
    query,
    [reviewer_id, seller_id, rating, comment],
    (err, results) => {
      if (err) {
        console.error("❌ Error inserting review:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }

      res.json({ message: "✅ Review added successfully" });
    }
  );
});



// Admin Authentication Middleware without Promises
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, "your_secret_key");
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  const sql = "SELECT * FROM users WHERE user_id = ? AND role = 'admin'";
  connection.query(sql, [decoded.id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = results[0];
    next();
  });
};

module.exports = authenticateAdmin;




app.get("/api/sold/:userId", (req, res) => {
    const userId =parseInt(req.params.userId);
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        if (decoded.id !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }
        // Fetch all food listings created by the user (sold or not)
        const query = `
            SELECT 
                f.listing_id,
                f.title, 
                f.price, 
                f.image_url, 
                f.quantity,
                f.avl,
                f.int_qnt as quantity_listed,
                f.created_at AS listing_date, 
                t.quantity AS quantity_sold,
                t.transaction_id, 
                t.transaction_date, 
                fos.status, 
                t.buyer_id, 
                u1.NAME AS buyer_name
            FROM foodlistings f
            LEFT JOIN transactions t ON f.listing_id = t.listing_id
            LEFT JOIN food_order_status fos ON t.transaction_id = fos.transaction_id
            LEFT JOIN users u1 ON t.buyer_id = u1.user_id
            WHERE f.user_id = ?
            ORDER BY COALESCE(t.transaction_date, f.created_at) DESC;
        `;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            res.json(results);
        });
    });
});
app.patch('/api/listing/:listing_id/status', authenticateToken, (req, res) => {
  const listingId = req.params.listing_id;
  const { avl } = req.body;

  if (!["online", "offline"].includes(avl)) {
    return res.status(400).json({ error: "Invalid status value. Must be 'online' or 'offline'." });
  }

  const query = "UPDATE foodlistings SET avl = ? WHERE listing_id = ?";

  connection.query(query, [avl, listingId], (err, results) => {
    if (err) {
      console.error("Error updating listing availability:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Listing not found." });
    }

    res.json({ message: `Listing updated to ${avl}.` });
  });
});

app.get("/api/bought/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }

        // Fetch all orders where the user is the buyer
        const query = `
            SELECT 
                t.transaction_id, 
                f.title, 
                f.price, 
                f.image_url, 
                t.transaction_date, 
                fos.status, 
                t.buyer_id, 
                t.seller_id, 
                u2.NAME AS seller_name 
            FROM transactions t
            JOIN foodlistings f ON t.listing_id = f.listing_id
            JOIN food_order_status fos ON t.transaction_id = fos.transaction_id
            JOIN users u2 ON t.seller_id = u2.user_id
            WHERE t.buyer_id = ?
            ORDER BY t.transaction_date DESC;
        `;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            res.json(results);
        });
    });
});
app.delete("/api/listing/:listingId", (req, res) => {
    const listingId = parseInt(req.params.listingId);
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    jwt.verify(token, "your_secret_key", (err, decoded) => {
        if (err) {
            console.log("JWT Error:", err.name, err.message);
            return res.status(403).json({ error: "Invalid token" });
        }

        const checkOwnershipQuery = `
            SELECT user_id FROM foodlistings WHERE listing_id = ?
        `;
        connection.query(checkOwnershipQuery, [listingId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database query failed" });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "Listing not found" });
            }
            const listingOwnerId = results[0].user_id;
            if (listingOwnerId !== decoded.id) {
                return res.status(403).json({ error: "You can only delete your own listings" });
            }

            const deleteQuery = `
                DELETE FROM foodlistings WHERE listing_id = ?
            `;
            connection.query(deleteQuery, [listingId], (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Database query failed" });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Listing not found" });
                }
                res.json({ success: true, message: "Listing deleted successfully" });
            });
        });
    });
});


app.get("/api/user/:id", authenticateToken, (req, res) => {
    const userId = req.params.id;

    connection.execute(
        "SELECT email, name, phone, address, city FROM users WHERE user_id = ?",
        [userId],
        (err, results) => {
            if (err) {
                console.error("Fetch error:", err);
                return res.status(500).json({ error: "Server error" });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json(results[0]);
        }
    );
});


app.put("/api/user/:id", authenticateToken, (req, res) => {
    const userId = req.params.id;
    const {
        name = null,
        phone = null,
        address = null,
        city = null
    } = req.body;

    const updateQuery = "UPDATE users SET name = ?, phone = ?, address = ?, city = ? WHERE user_id = ?";
    const updateFields = [name, phone, address, city, userId];

   

    connection.execute(updateQuery, updateFields, (err, results) => {
        if (err) {
            console.error("Update error:", err);
            return res.status(500).json({ error: "Update failed" });
        }
        res.json({ message: "Profile updated successfully" });
    });
});
app.get("/api/listings/city/:city", authenticateToken, (req, res) => {
    const { city } = req.params;
    const currentUserId = req.user.id; // comes from token
    

    const sql = `
            SELECT 
            f.*, 
            u.NAME, 
            ROUND(AVG(r.rating), 1) AS Rating,
            r.comment
        FROM 
            foodlistings f
        JOIN 
            users u ON f.user_id = u.user_id
        LEFT JOIN 
            reviews r ON f.user_id = r.seller_id
        WHERE 
            u.city = ? 
            AND f.user_id != ? 
            AND f.avl = 'online' 
            AND f.quantity > 0
            AND f.expiry_date >= CURRENT_DATE
        GROUP BY 
            f.listing_id
    `;
  
    connection.query(sql, [city, currentUserId], (err, results) => {
      if (err) {
        console.error("Error fetching listings:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
  
      res.json(results);
    });
  });
  // Assuming Express setup and DB connection is already done
  app.get("/api/reviews/:seller_id", (req, res) => {
    const sellerId = req.params.seller_id;
  
    const query = `
      SELECT r.comment, u.name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id
      WHERE r.seller_id = ?
      ORDER BY r.review_date DESC
    `;
  
    connection.query(query, [sellerId], (err, results) => {
      if (err) {
        console.error("Error fetching reviews:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
  
      res.json(results);
    });
  });
  
app.put("/api/cart/:cart_id", authenticateToken, (req, res) => {
  const cartId = req.params.cart_id;
  const newQuantity = req.body.quantity;

  if (!newQuantity || newQuantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const sql = `UPDATE cart SET quantity = ? WHERE cart_id = ?`;
  connection.query(sql, [newQuantity, cartId], (err, result) => {
    if (err) {
      console.error("DB error updating cart:", err);
      return res.status(500).json({ error: "Failed to update cart" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ success: true, message: "Quantity updated" });
  });
});

  app.delete('/api/cart/:cart_id', function (req, res) {
    const cartId = req.params.cart_id;
  
    connection.query('DELETE FROM cart WHERE cart_id = ?', [cartId], function (err, result) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
  
      res.json({ message: 'Item removed from bag' });
    });
  });
app.post("/api/cart", authenticateToken, (req, res) => {
    const { user_id, listing_id, quantity } = req.body;
  
    const query = "INSERT INTO cart (user_id, listing_id, quantity, added_at) VALUES (?, ?, 1, NOW())";
  
    connection.execute(query, [user_id, listing_id], (err, result) => {
      if (err) {
        console.error("Cart insertion error:", err);
        return res.status(500).json({ error: "Failed to add to cart" });
      }
      res.json({ message: "Added to cart successfully" });
    });
  });
  app.get('/api/cart/:user_id', authenticateToken, (req, res) => {
    const userId = req.params.user_id;
  
    connection.query(
      `SELECT c.cart_id, c.user_id, c.listing_id, c.quantity as cart_quantity,
              l.title, l.price, l.quantity as available_quantity, l.image_url,u.NAME
       FROM cart c
       JOIN foodlistings l ON c.listing_id = l.listing_id
       join users u on u.user_id=l.user_id
       WHERE c.user_id = ?`,
      [userId],
      (err, results) => {
        if (err) {
          console.error("Error fetching cart:", err);
          return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
          return res.status(200).json([]);  // Empty cart is okay
        }
        res.json(results);
      }
    );
  });
  
  app.post('/api/checkout/:user_id', authenticateToken, (req, res) => {
    const userId = req.params.user_id;
    console.log("Checkout started for user:", userId);
  
    connection.beginTransaction(err => {
      if (err) {
        console.error("Transaction error:", err);
        return res.status(500).json({ success: false, error: "Transaction start failed" });
      }
  
      connection.query(`
        SELECT c.cart_id, c.listing_id, c.quantity, l.quantity as available_quantity, l.user_id AS seller_id, l.price
        FROM cart c
        JOIN foodlistings l ON c.listing_id = l.listing_id
        WHERE c.user_id = ?
      `, [userId], (err, cartItems) => {
        if (err) {
          console.error("Cart query error:", err);
          return connection.rollback(() => {
            res.status(500).json({ success: false, error: "Cart query failed" });
          });
        }
  
        if (!cartItems.length) {
          console.warn("Cart is empty for user:", userId);
          return connection.rollback(() => {
            res.status(400).json({ success: false, error: "Cart is empty" });
          });
        }
  
        const now = new Date();
        let processed = 0;
  
        cartItems.forEach(item => {
          if (item.quantity > item.available_quantity) {
            return connection.rollback(() => {
              res.status(400).json({ success: false, error: "Insufficient stock for listing: " + item.listing_id });
            });
          }
  
          const totalPrice = item.quantity * item.price;
  
          connection.query(`
            INSERT INTO transactions (buyer_id, seller_id, listing_id, transaction_date, total_price, payment_status,quantity)
            VALUES (?, ?, ?, ?, ?, 'pending',?)
          `, [userId, item.seller_id, item.listing_id, now, totalPrice,item.quantity], (err, transResult) => {
            if (err) {
              console.error("Insert into transactions failed:", err);
              return connection.rollback(() => {
                res.status(500).json({ success: false, error: "Failed to record transaction" });
              });
            }
  
            const transactionId = transResult.insertId;
  
            connection.query(`
              INSERT INTO food_order_status (transaction_id, status, updated_at)
              VALUES (?, 'pending', ?)
            `, [transactionId, now], (err) => {
              if (err) {
                console.error("Insert into status table failed:", err);
                return connection.rollback(() => {
                  res.status(500).json({ success: false, error: "Failed to record status" });
                });
              }
  
              const newQuantity = item.available_quantity - item.quantity;
  
              connection.query(`
                UPDATE foodlistings SET quantity = ?
                WHERE listing_id = ?
              `, [newQuantity, item.listing_id], (err) => {
                if (err) {
                  console.error("Update quantity failed:", err);
                  return connection.rollback(() => {
                    res.status(500).json({ success: false, error: "Failed to update listing" });
                  });
                }
  
                connection.query(`
                  DELETE FROM cart WHERE cart_id = ?
                `, [item.cart_id], (err) => {
                  if (err) {
                    console.error("Failed to delete from cart:", err);
                    return connection.rollback(() => {
                      res.status(500).json({ success: false, error: "Failed to clear cart" });
                    });
                  }
  
                  processed++;
                  if (processed === cartItems.length) {
                    connection.commit(err => {
                      if (err) {
                        console.error("Commit failed:", err);
                        return connection.rollback(() => {
                          res.status(500).json({ success: false, error: "Commit failed" });
                        });
                      }
  
                      console.log("Checkout success for user:", userId);
                      res.json({ success: true, message: "Order placed successfully!" });
                    });
                  }
                });
              });
            });
          });
        });
      });
    });
  });
  
  

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));

