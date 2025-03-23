import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

interface UserPrefrences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailverified: boolean;
  createdAt: Date;
  updatedAt: Date;
  userPreferences: UserPrefrences;
  comparePasswords(value: string): Promise<boolean>;
}

const userPrefrencesSchema = new Schema<UserPrefrences>({
  enable2FA: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFactorSecret: { type: String, required: false },
});

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isEmailverified: { type: Boolean, default: false },
    userPreferences: {
      type: userPrefrencesSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {}, // only called when we called this function by ourself
  }
);

//hasing the password before save to db
userSchema.pre("save", async function (next) {
  // Check if the password field has been modified
  if (this.isModified("password")) {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);
  }
});

//compared the hashed passowrds
userSchema.methods.comparePasswords = async function (value: string) {
  return await bcrypt.compare(value, this.password);
};

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.userPreferences.twoFactorSecret;
    return ret;
  },
});

const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
