const { connection } = require('../config/db');

exports.addReview = (req, res) => {
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
        return res.status(500).json({ error: "Database insert failed" });
      }
      res.json({ message: "✅ Review added successfully" });
    }
  );
};

exports.getReviewsBySeller = (req, res) => {
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
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
}; 