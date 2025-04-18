const ort = require("onnxruntime-node");
const Lesson = require("../models/lessonModel");
// const multer = require("multer");
// const upload = multer();

let model;

exports.loadModel = async (modelPath) => {
  model = await ort.InferenceSession.create(modelPath);
  console.log("ONNX model loaded.");
};

exports.predict = async (req, res) => {
  try {
    const inputData = req.body.input; // Ensure it's [1, 42] shape
    const lessonID = req.body.lesson_id;
    const lesson = Lesson.findOne({ lesson_id: lessonID });
    model = loadModel(lesson.model_path);

    if (!model) throw new Error("Model not loaded yet!");
    const inputTensor = new ort.Tensor("float32", inputData, [1, 42]);
    const results = await model.run({ input: inputTensor });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Prediction failed.");
  }
};

// let static;
// let dynamic;

// exports.loadModel = async (staticPath, dynamicPath) => {
//   static = await ort.InferenceSession.create(staticPath);
//   dynamic = await ort.InferenceSession.create(dynamicPath);
//   console.log("ONNX model loaded.");
// };

// exports.predictStatic = async (req, res) => {
//   try {
//     const inputData = req.body.input; // Ensure it's [1, 42] shape
//     if (!static) throw new Error("Model not loaded yet!");
//     const inputTensor = new ort.Tensor("float32", inputData, [1, 42]);
//     const results = await static.run({ input: inputTensor });
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Prediction failed.");
//   }
// };

// exports.predictDynamic = async (req, res) => {
//   try {
//     const inputData = req.body.input; // Ensure it's [1, 42] shape
//     if (!dyna) throw new Error("Model not loaded yet!");
//     const inputTensor = new ort.Tensor("float32", inputData, [1, 42]);
//     const results = await dyna.run({ input: inputTensor });
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Prediction failed.");
//   }
// };
