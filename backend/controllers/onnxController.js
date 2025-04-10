const ort = require("onnxruntime-node");
const multer = require("multer");
const upload = multer();

let session; // Global inside this file

exports.loadModel = async () => {
  session = await ort.InferenceSession.create("../AI/keypoint_classifier.onnx");
  console.log("ONNX model loaded.");
};

exports.predict = async (req, res) => {
  try {
    const inputData = req.body.input; // Ensure it's [1, 42] shape
    if (!session) throw new Error("Model not loaded yet!");
    const inputTensor = new ort.Tensor("float32", inputData, [1, 42]);
    const results = await session.run({ input: inputTensor });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Prediction failed.");
  }
};
