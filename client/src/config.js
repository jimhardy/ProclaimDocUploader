export const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.cloudinary.com/v1_1/dm5opqsyb/image/upload'
    : 'http://localhost:8080';
