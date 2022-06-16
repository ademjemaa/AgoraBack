import mongoose from "mongoose";

const waveSchema = mongoose.Schema({
  premLimit: { type: Number, default: 0 },
  standLimit: { type: Number, default: 0 },
  premPrice: { type: Number, default: 0 },
  standPrice: { type: Number, default: 0 },
  start: { type: Number, default: new Date() },
  end: { type: Number, default: new Date() },
});

const wave = mongoose.model("waveSchema", waveSchema);

export default wave;