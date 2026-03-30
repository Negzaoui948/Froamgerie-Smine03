const { v2: cloudinary } = require("cloudinary");

// Support both CLOUDINARY_URL and individual env vars
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
  console.log("[Cloudinary] Configuré via CLOUDINARY_URL");
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("[Cloudinary] Configuré via variables individuelles");
}

console.log("[Cloudinary] Config:", {
  cloud_name: cloudinary.config().cloud_name ? "✓" : "✗",
  api_key: cloudinary.config().api_key ? "✓" : "✗",
  api_secret: cloudinary.config().api_secret ? "✓" : "✗"
});

const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Upload Error]", error);
          reject(error);
          return;
        }

        console.log("[Cloudinary Upload Success]", {
          secure_url: result.secure_url,
          public_id: result.public_id
        });
        resolve(result);
      }
    );

    stream.end(buffer);
  });

const extractPublicId = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("/upload/")) {
    return null;
  }

  const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

const destroyImage = async (imageUrl) => {
  const publicId = extractPublicId(imageUrl);

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadBuffer,
  destroyImage
};
