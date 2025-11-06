
const CONFIG = {
  BASE_URL: "https://striveschool-api.herokuapp.com/api/product/",
  TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTA1ZDQzMjNhMTVjZDAwMTVkYTNiMjIiLCJpYXQiOjE3NjE5ODk2ODIsImV4cCI6MTc2MzE5OTI4Mn0.SQaxBT1_FAjNdny3Hvlnpd7qo7ZuePmhX78EeD8GhHM",
  STORAGE_KEYS: {
    AUTH: "isAuthenticated",
    CART: "cart",
  },
  ALERT_DURATION: 5000,
  REDIRECT_DELAY: 1500,
};

const STATE = {
  products: [],
  cart: [],
  editingProductId: null,
  isAuthenticated: false,
};
