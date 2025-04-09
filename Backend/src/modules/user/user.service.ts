import UserModel from "../../database/models/userModel";
import { NotFoundException } from "../../utils/ErrorTypes";

export const UserService = async (userId: string) => {
  try {
    const user = await UserModel.findById(userId, {
      password: false,
    });
    return user || null;
  } catch (error) {
    throw new NotFoundException("User not found.");
  }
};
