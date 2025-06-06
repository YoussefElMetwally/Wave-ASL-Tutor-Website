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

    let input;

    if (fileName.startsWith("STATIC")) {
      const avgFrame = averageFrames(landmarks);
      input = new ort.Tensor("float32", Float32Array.from(avgFrame), [
        1,
        avgFrame.length,
      ]);
    } else if (fileName.startsWith("DYNAMIC")) {
      const dynamicFrames = landmarks.slice(0, 30);

      // console.log(dynamicFrames.length);
      // console.log(dynamicFrames[0].length);

      const normalizedFrames = normalizeSequenceWeb(dynamicFrames);

      if (!Array.isArray(normalizedFrames[0])) {
        return res.status(400).json({
          message: "Landmarks should be a 2D array for DYNAMIC model",
        });
      }

      const frames = normalizedFrames.length;
      const features = normalizedFrames[0].length;

      // Flatten 2D array landmarks into 1D Float32Array
      const flattenedLandmarks = Float32Array.from(normalizedFrames.flat());

      // Create input tensor with shape [1, frames, features]
      input = new ort.Tensor("float32", flattenedLandmarks, [
        1,
        frames,
        features,
      ]);
    } else {
      res.status(500).json({ message: "Model name error" });
    }

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

function normalizeSequenceWeb(keypointsArray) {
  const normalizedSequence = [];
  
  for (let frame of keypointsArray) {
    // frame is a 183-length array (33 pose × 3 + 21 left × 2 + 21 right × 2)
    if (frame.every((v) => v === 0)) {
      normalizedSequence.push(frame);
      continue;
    }

    // Reshape for easier calculations (183 vector -> pose, lh, rh)
    const pose_kps = [];
    const lh_kps = [];
    const rh_kps = [];
    
    // Split frame into parts
    const pose = frame.slice(0, 99); // 33 × 3
    const lh = frame.slice(99, 141); // 21 × 2
    const rh = frame.slice(141); // 21 × 2
    
    for (let i = 0; i < 33; i++) pose_kps.push(pose.slice(i * 3, i * 3 + 3));
    for (let i = 0; i < 21; i++) lh_kps.push(lh.slice(i * 2, i * 2 + 2));
    for (let i = 0; i < 21; i++) rh_kps.push(rh.slice(i * 2, i * 2 + 2));

    // --- 1. Translation Normalization (center on hip midpoint) ---
    const hip_l = pose_kps[23];
    const hip_r = pose_kps[24];
    let origin;
    
    // Check visibility flag (3rd value, index 2) to find a stable origin
    if (hip_l[2] > 0.5 && hip_r[2] > 0.5) {
      origin = [(hip_l[0] + hip_r[0]) / 2.0, (hip_l[1] + hip_r[1]) / 2.0];
    } else if (hip_l[2] > 0.5) {
      origin = [hip_l[0], hip_l[1]];
    } else if (hip_r[2] > 0.5) {
      origin = [hip_r[0], hip_r[1]];
    } else {  // Fallback to nose if hips are not visible
      origin = [pose_kps[0][0], pose_kps[0][1]];
    }

    // Subtract the origin from all x,y coordinates
    for (let pt of pose_kps) {
      pt[0] -= origin[0];
      pt[1] -= origin[1];
    }
    for (let pt of lh_kps) {
      pt[0] -= origin[0];
      pt[1] -= origin[1];
    }
    for (let pt of rh_kps) {
      pt[0] -= origin[0];
      pt[1] -= origin[1];
    }

    // --- 2. Scale Normalization (relative to shoulder distance) ---
    const shoulder_l = pose_kps[11];
    const shoulder_r = pose_kps[12];
    let scale = 1.0;
    
    if (shoulder_l[2] > 0.5 && shoulder_r[2] > 0.5) {
      // Use L2 norm for 2D distance
      const dx = shoulder_l[0] - shoulder_r[0];
      const dy = shoulder_l[1] - shoulder_r[1];
      scale = Math.sqrt(dx * dx + dy * dy);
      if (scale < 1e-6) {  // Avoid division by zero
        scale = 1.0;
      }
    }

    for (let pt of pose_kps) {
      pt[0] /= scale;
      pt[1] /= scale;
    }
    for (let pt of lh_kps) {
      pt[0] /= scale;
      pt[1] /= scale;
    }
    for (let pt of rh_kps) {
      pt[0] /= scale;
      pt[1] /= scale;
    }

    // Flatten back into a single 183-length vector
    const processed_frame = [];
    
    // Add pose keypoints (with visibility)
    for (let pt of pose_kps) {
      processed_frame.push(pt[0], pt[1], pt[2]);
    }
    
    // Add left hand keypoints (without visibility)
    for (let pt of lh_kps) {
      processed_frame.push(pt[0], pt[1]);
    }
    
    // Add right hand keypoints (without visibility)
    for (let pt of rh_kps) {
      processed_frame.push(pt[0], pt[1]);
    }
    
    normalizedSequence.push(processed_frame);
  }

  return normalizedSequence;
}
