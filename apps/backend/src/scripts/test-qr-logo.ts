import { QRCodeService } from "../services/qr-code.service.js";

async function testQRCodeWithLogo() {
  console.log("🧪 Testing QR Code with Logo Generation...\n");

  try {
    // Test content
    const qrContent = `Physical Registration Details
Student UID: 1004250002
Date: 03/11/2025
Time: 10:30 AM
Venue: 4 A Hall

Please report at the specified time and venue for physical submission of your CU Registration form.`;

    // College logo URL
    const logoUrl = "https://api.academic360.app/api/v1/settings/file/4";

    console.log("📝 QR Content:");
    console.log(qrContent);
    console.log("\n🏫 Logo URL:", logoUrl);

    // Generate QR code with logo
    console.log("\n🔄 Generating QR code with logo...");
    const qrCodeDataUrl = await QRCodeService.generateQRCodeWithLogo(
      qrContent,
      logoUrl,
      200, // QR code size
      40, // Logo size
    );

    console.log("✅ QR code with logo generated successfully!");
    console.log("📱 Data URL length:", qrCodeDataUrl.length);
    console.log(
      "🎯 Data URL starts with:",
      qrCodeDataUrl.substring(0, 50) + "...",
    );

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testQRCodeWithLogo();
