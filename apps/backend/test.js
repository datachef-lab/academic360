import axios from "axios";
import qs from "qs";

const MERCHANT_KEY = "YOUR_SANDBOX_KEY";
const MERCHANT_SALT = "YOUR_SANDBOX_SALT";

// Create a dummy payment order
async function testEasebuzz() {
  const params = {
    key: MERCHANT_KEY,
    txnid: "TXN" + Date.now(),
    amount: "1.00", // small test amount
    firstname: "Test",
    email: "test@example.com",
    phone: "9999999999",
    productinfo: "Test Product",
    surl: "https://example.com/success",
    furl: "https://example.com/failure",
  };

  // Normally you generate a hash, but for testing, you can skip
  // params.hash = generateHash(params, MERCHANT_SALT);

  try {
    const response = await axios.post(
      "https://testpay.easebuzz.in/payment/initiate", // sandbox/test URL
      qs.stringify(params),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    console.log("Test Response:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testEasebuzz();
