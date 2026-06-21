require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://af1-wq.github.io', 'http://localhost:5173']
}));
app.use(express.json());

app.get('/', (req, res) => res.status(200).send('Servidor activo'));

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, systemPrompt, model, temperature, max_tokens } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 4000
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        return res.status(response.status).json({ error: "La IA está procesando peticiones muy rápido. Por favor, espera un par de segundos y vuelve a intentar." });
      }
      return res.status(response.status).json({ error: data.error?.message || data.error || 'Error from Groq API' });
    }

    res.json(data);

  } catch (error) {
    console.error('Error forwarding to Groq:', error);
    res.status(500).json({ error: "La IA está procesando peticiones muy rápido. Por favor, espera un par de segundos y vuelve a intentar." });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
