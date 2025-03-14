const { HfInference } = require("@huggingface/inference");

const inference = new HfInference(process.env.HF_KEY);
const aslModel = "boishou/asl_Model";

exports.getPrediction = async (req, res) => {
  try {
    const inputData = req.body.input;

    // Ensure inputData is a 1D array with 42 elements
    if (!Array.isArray(inputData) || inputData.length !== 42) {
      throw new Error("Input must be a 1D array with 42 numerical elements.");
    }

    const response = await inference.featureExtraction({
      model: aslModel,
      inputs: inputData,
    });

    res.status(200).json(response); // Send back the prediction
  } catch (error) {
    console.error("Error details:", error.message);
    res.status(500).json({ error: error.message });
  }
};
