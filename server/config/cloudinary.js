const { v2: cloudinary } = require("cloudinary");

const connectCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary Connected");
  } catch (error) {
    console.error(`Cloudinary config error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectCloudinary, cloudinary };