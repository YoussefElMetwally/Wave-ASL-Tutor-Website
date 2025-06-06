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

    console.log("Raw: ", landmarks);

    if (!landmarks || !Array.isArray(landmarks)) {
      return res.status(400).json({ message: "Missing or invalid landmarks" });
    }

    if (fileName.startsWith("STATIC")) {
      const avgFrame = averageFrames(landmarks);
      const input = new ort.Tensor("float32", Float32Array.from(avgFrame), [
        1,
        avgFrame.length,
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
      // Log the received landmarks for debugging
    /*  console.log('Received landmarks for dynamic model:', {
        framesCount: landmarks.length,
        firstFrameSample: landmarks[0]?.slice(0, 10), // First 10 values of first frame
        lastFrameSample: landmarks[landmarks.length - 1]?.slice(0, 10), // First 10 values of last frame
        frameLengths: landmarks.map(frame => frame.length), // Check if all frames have correct length
        hasNullValues: landmarks.some(frame => frame.some(val => val === null || val === undefined)),
        valueRange: {
          min: Math.min(...landmarks.flat()),
          max: Math.max(...landmarks.flat())
        }
      }); */

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
