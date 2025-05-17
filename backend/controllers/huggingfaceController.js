const { HfInference } = require("@huggingface/inference");

const hf = new HfInference(process.env.HF_KEY);

exports.TTS = async (req, res) => {
  const text = req.body.input;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required." });
  }

  try {
    const result = await hf.textToSpeech({
      model: "hexgrad/Kokoro-82M",
      inputs: text,
    });

    res.set("Content-Type", "audio/wav");
    res.send(Buffer.from(result, "binary"));
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ error: "Failed to generate speech." });
  }
};
