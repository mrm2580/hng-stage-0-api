const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// CORS (mandatory)
app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;

// Endpoint
app.get('/api/classify', async (req, res) => {
  try {
    const { name } = req.query;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name parameter"
      });
    }

    if (typeof name !== 'string') {
      return res.status(422).json({
        status: "error",
        message: "name is not a string"
      });
    }

    // External API call
    const response = await axios.get(`https://api.genderize.io`, {
      params: { name },
      timeout: 5000
    });

    const { gender, probability, count } = response.data;

    // Edge case
    if (!gender || count === 0) {
      return res.status(422).json({
        status: "error",
        message: "No prediction available for the provided name"
      });
    }

    // Processing
    const sample_size = count;

    const is_confident =
      probability >= 0.7 && sample_size >= 100;

    const processed_at = new Date().toISOString();

    // Response
    return res.status(200).json({
      status: "success",
      data: {
        name: name.toLowerCase(),
        gender,
        probability,
        sample_size,
        is_confident,
        processed_at
      }
    });

  } catch (error) {
    if (error.response) {
      return res.status(502).json({
        status: "error",
        message: "Upstream service error"
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});