module.exports = async (req, res) => {
  try {
    console.log("Webhook recebido:", req.body);
    res.status(200).send("OK");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
