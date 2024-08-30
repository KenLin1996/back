import { Schema, model } from "mongoose";

const CharacterSchema = new Schema({
  name: {
    type: String,
    required: [true, "角色名稱必填"],
  },
  race: {
    type: String,
    required: [true, "種族必填"],
  },
  gender: {
    type: String,
    required: [true, "性別必填"],
  },
  occupation: {
    type: String,
    required: [true, "職業必填"],
  },
  headshot: String,
  nation: String,
  region: String,
  birthday: String,
  height: String,
  weight: String,
  bloodType: String,
  hairColor: String,
  eyeColor: String,
  petPhrase: String,
  relationshipStatus: String,
  roleDescription: String,
  interest: String,
  skill: String,
  dream: String,
  weakness: String,
  secret: String,
  emergeStory: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "作者必填"],
  },
  followNum: {
    type: Number,
    default: 0,
    required: [true, "關注數必填"],
  },
});

export default model("Character", CharacterSchema);
