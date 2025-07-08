const { connection } = require('../config/db');

exports.addToCart = (req, res) => {
    const { user_id, listing_id, quantity } = req.body;
    const query = "INSERT INTO cart (user_id, listing_id, quantity, added_at) VALUES (?, ?, 1, NOW())";
    connection.execute(query, [user_id, listing_id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to add to cart" });
      }
      res.json({ message: "Added to cart successfully" });
    });
};

exports.getCart = (req, res) => {
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
          return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
          return res.status(200).json([]);
        }
        res.json(results);
      }
    );
};

exports.updateCartQuantity = (req, res) => {
  const cartId = req.params.cart_id;
  const newQuantity = req.body.quantity;
  if (!newQuantity || newQuantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }
  const sql = `UPDATE cart SET quantity = ? WHERE cart_id = ?`;
  connection.query(sql, [newQuantity, cartId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update cart" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    res.json({ success: true, message: "Quantity updated" });
  });
};

exports.deleteCartItem = (req, res) => {
    const cartId = req.params.cart_id;
    connection.query('DELETE FROM cart WHERE cart_id = ?', [cartId], function (err, result) {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      res.json({ message: 'Item removed from bag' });
    });
};

exports.checkout = (req, res) => {
    const userId = req.params.user_id;
    const { connection } = require('../config/db');
    connection.beginTransaction(err => {
      if (err) {
        return res.status(500).json({ success: false, error: "Transaction start failed" });
      }
      connection.query(`
        SELECT c.cart_id, c.listing_id, c.quantity, l.quantity as available_quantity, l.user_id AS seller_id, l.price
        FROM cart c
        JOIN foodlistings l ON c.listing_id = l.listing_id
        WHERE c.user_id = ?
      `, [userId], (err, cartItems) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ success: false, error: "Cart query failed" });
          });
        }
        if (!cartItems.length) {
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
                  return connection.rollback(() => {
                    res.status(500).json({ success: false, error: "Failed to update listing" });
                  });
                }
                connection.query(`
                  DELETE FROM cart WHERE cart_id = ?
                `, [item.cart_id], (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      res.status(500).json({ success: false, error: "Failed to clear cart" });
                    });
                  }
                  processed++;
                  if (processed === cartItems.length) {
                    connection.commit(err => {
                      if (err) {
                        return connection.rollback(() => {
                          res.status(500).json({ success: false, error: "Commit failed" });
                        });
                      }
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
}; 