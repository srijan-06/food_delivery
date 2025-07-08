const express = require("express");
const adminAuth = require("../middlewares/adminAuth");
const { promise } = require("../config/db");
const router = express.Router();

// Get all users
router.get("/users",  async (req, res) => {
    try {
        const [users] = await promise.query("SELECT user_id,NAME,email,phone,address,city,created_at,role FROM users");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Get all food listings
router.get("/listings",  async (req, res) => {
    try {
        const [listings] = await promise.query("SELECT * FROM  foodlistings");
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Get all orders
router.get("/orders",  async (req, res) => {
    try {
        const [orders] = await promise.query("SELECT  transaction_id,buyer_id,seller_id,listing_id,transaction_date,total_price,quantity FROM  transactions");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Get all reviews
router.get("/reviews",  async (req, res) => {
    try {
        const [reviews] = await promise.query("SELECT * FROM  reviews");
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Get all reviews
router.get("/order-status",  async (req, res) => {
  try {
      const [reviews] = await promise.query("SELECT * FROM  food_order_status");
      res.json(reviews);
  } catch (error) {
      res.status(500).json({ error: "Database error" });
  }
});

router.put("/order-status/:id", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const [results] = await promise.query(
        "UPDATE food_order_status SET status = ?, updated_at = NOW() WHERE status_id = ?",
        [status, id]
    );
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/users/:id",  async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await promise.query("DELETE FROM users WHERE user_id = ?", [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
  
  // DELETE food listing
  router.delete("/listings/:id",  async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await promise.query("DELETE FROM foodlistings WHERE listing_id = ?", [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Food listing not found" });
      }
      res.json({ message: "Food listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting food listing:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
  
  // DELETE order
  router.delete("/orders/:id",  async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await promise.query("DELETE FROM transactions WHERE order_id = ?", [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
  
  // DELETE review
  router.delete("/reviews/:id",  async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await promise.query("DELETE FROM reviews WHERE review_id = ?", [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

module.exports = router;
