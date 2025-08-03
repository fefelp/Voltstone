const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('🚀 Bot de Rendimento 20% APY rodando com sucesso!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});