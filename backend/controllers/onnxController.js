const ort = require("onnxruntime-node");
const Lesson = require("../models/lessonModel");
const path = require("path");

let session; // Global inside this file

exports.classify = async (req, res) => {
  try {
    const lessonID = req.body.lesson_id;
    const lesson = await Lesson.findOne({ lesson_id: lessonID });
    const labels = lesson.model_labels;
    if (!lesson || !lesson.model_path) {
      return res.status(404).json({ message: "Lesson or model not found" });
    }

    const modelPath = path.join(
      __dirname,
      "..",
      "AI",
      String(lesson.model_path)
    );

    console.log(modelPath);

    const fileName = String(path.basename(modelPath));
    model = await ort.InferenceSession.create(modelPath);
    const landmarks = req.body.landmarks;

    if (!landmarks || !Array.isArray(landmarks)) {
      return res.status(400).json({ message: "Missing or invalid landmarks" });
    }

    if (fileName.startsWith("STATIC")) {
      const avgFrame = averageFrames(landmarks);
      const norm = [];
      for (let index = 0; index < avgFrame.length; index++) {
        if (index % 2 === 0) {
          norm[index] = avgFrame[index] - avgFrame[0];
        } else {
          norm[index] = avgFrame[index] - avgFrame[1];
        }
      }
      const input = new ort.Tensor("float32", Float32Array.from(norm), [
        1,
        norm.length,
      ]);

      let inputName = model.inputNames[0]; // get actual input name
      let result = await model.run({ [inputName]: input });

      const output = result[Object.keys(result)[0]];
      const scores = output.data;

      let max = 0;
      let maxIndex;
      let sum = 0;
      for (let index = 0; index < scores.length; index++) {
        sum = sum + scores[index];
        if (scores[index] > max) {
          max = scores[index];
          maxIndex = index;
        }
      }

      const confidence = (scores[maxIndex] / sum) * 100;
      console.log(maxIndex);
      console.log(labels[maxIndex]);
      console.log(confidence, "%");

      res.status(200).json({
        predictedSign: labels[maxIndex],
        confidence: confidence,
      });
    } else if (fileName.startsWith("DYNAMIC")) {
      res.status(501).json({ message: "Dynamic model support coming soon" });
    } else {
      res.status(500).json({ message: "Model name error" });
    }
  } catch (err) {
    console.error("Error during classification:", err);
    res.status(500).json({ message: "Server error" });
  }
};

function averageFrames(frames) {
  if (frames.length === 0) return [];
  const summed = new Array(frames[0].length).fill(0);
  frames.forEach((frame) => {
    frame.forEach((val, i) => (summed[i] += val));
  });
  return summed.map((v) => v / frames.length);
}
