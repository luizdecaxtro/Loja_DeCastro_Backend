const mercadopago = require("mercadopago");

// Configurar com token privado
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const preference = {
      items: [
        {
          title: "Livro Loja DeCastro",
          unit_price: 50,
          quantity: 1
        }
      ],
      back_urls: {
        success: "https://SEU_USUARIO.github.io/SEU_REPOSITORIO/sucesso.html",
        failure: "https://SEU_USUARIO.github.io/SEU_REPOSITORIO/falha.html",
        pending: "https://SEU_USUARIO.github.io/SEU_REPOSITORIO/pendente.html"
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ id: response.body.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
