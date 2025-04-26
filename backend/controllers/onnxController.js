const ort = require("onnxruntime-node");
const Lesson = require("../models/lessonModel");
const path = require("path");

let model;

exports.classify = async (req, res) => {
  try {
    const lessonID = req.body.lesson_id;
    const lesson = await Lesson.findOne({ lesson_id: lessonID });

    if (!lesson || !lesson.model_path) {
      return res.status(404).json({ message: "Lesson or model not found" });
    }

    console.log(lesson.model_path);
    const modelPath = String(lesson.model_path);
    console.log(modelPath);
    const fileName = String(path.basename(modelPath));
    console.log(fileName);

    model = await ort.InferenceSession.create(modelPath);
    const landmarks = req.body.landmarks;

    if (!landmarks || !Array.isArray(landmarks)) {
      return res.status(400).json({ message: "Missing or invalid landmarks" });
    }

    if (fileName.startsWith("STATIC")) {
      const avgFrame = averageFrames(landmarks);
      const input = new ort.Tensor("float32", Float32Array.from(avgFrame), [
        1,
        avgFrame.length,
      ]);

      console.log(input);

      let inputName = model.inputNames[0]; // get actual input name
      let result = await model.run({ [inputName]: input });

      const output = result[Object.keys(result)[0]];
      const scores = output.data;

      let max = 0;
      let maxIndex;
      for (let index = 0; index < scores.length; index++) {
        if (scores[index] > max) {
          max = scores[index];
          maxIndex = index;
        }
      }

      //const maxIndex = scores.indexOf(Math.max(...scores));
      console.log(output);
      console.log(maxIndex);
      console.log(max);

      res.status(200).json({
        predicted_class: scores[maxIndex],
        probabilities: Array.from(scores),
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
