export const formatAadhaarCardNumber = (aadhaar: string | undefined): string | undefined => {
    if (!aadhaar) return undefined;
    // Remove spaces and dashes
    const cleanedAadhaar = aadhaar.replace(/[\s-]/g, '');
    // Add a dash after every 4 characters
    return cleanedAadhaar.match(/.{1,4}/g)?.join('-');
};