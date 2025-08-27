import fetch from "node-fetch";

const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY!;
const INTERAKT_BASE_URL = process.env.INTERAKT_BASE_URL!;
const DEVELOPER_PHONE = process.env.DEVELOPER_PHONE;
const NODE_ENV = process.env.NODE_ENV;

export const sendWhatsAppMessage = async (to: string, messageArr: string[] = [], templateName: string = "OTP") => {
    console.log("messageArr:", messageArr);
    try {
        // Use developer phone in development mode
        const phoneNumber = NODE_ENV === 'development' ? DEVELOPER_PHONE! : to;

        const requestBody = {
            countryCode: '+91',
            phoneNumber,
            type: 'Template',
            template: {
                name: templateName,
                languageCode: 'en',
                headerValues: ['Alert'],
                bodyValues: messageArr,
            },
            data: {
                message: '',
            },
        };
        // 
        const response = await fetch(INTERAKT_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${INTERAKT_API_KEY}`,
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response Status:', response.status);
        console.log('Response Headers:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorResponse = await response.json(); // Log the error response
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${JSON.stringify(errorResponse)}`);
        }

        const { result, message } = await response.json() as {result: boolean, message: string}
        console.log(result, message)

        return { result, message };

    } catch (error) {
        console.error(error);
        // throw error
        return { result: false, message: "Error sending WhatsApp message" };
    }
}