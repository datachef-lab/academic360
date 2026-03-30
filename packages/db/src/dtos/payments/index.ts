export interface PaytmPCFDetailsRequest {
    head: {
        version?: string; // Version of the API.
        requestTimestamp?: string; // EPOCH timestamp of the time at which request is being sent.
        channelId?: string; // The parameter value identifies the Channel for which API call is initiated. Possible values: WEB , WAP
        txnToken: string; // This is the unique transaction token received in the response of Initiate Transaction API. It is valid for 15 minutes.
    },
    body: {
        payMethods: {
            payMethod: string; // Payment method. Possible Values: BALANCE, UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, EMI
            instId?: string; // Instrument Details.
        }[];
    }
}

interface PaytmPCFDetailsResponseMoney {
    value: string; // This parameter contains the amount to be charged to the customer and can have two places of decimal. Example: 1.00
    currency: string; // This parameter indicates the currency in which transaction amount is to be deducted. Possible Values: INR
}

export interface PaytmPCFDetailsResponse {
    head: {
        version: string;
        responseTimestamp: string;
        requestId: string;
    },
    body: {
        resultInfo: {
            resultCode: string; // This is the resultCode corresponding to a particular message and is returned to the merchant. It's maximum length is 64. The different result codes corresponding to this API are mentioned
            resultStatus: string; // This parameter indicates the status of API call. Possible Values: S, F, U
            resultMsg: string; // This parameter is the result message which contains information about the result.The different result messages corresponding to this API are mentioned.
        },
        extraParamsMap: Record<string, unknown>; // Map for any extra information (in case of error).
        consultDetails: {
            payMethod: string; // Payment method for transaction
            baseTransactionAmount: PaytmPCFDetailsResponseMoney; // Transaction amount which is sent in the Initiate Transaction API request.
            feeAmount: PaytmPCFDetailsResponseMoney; // Extra charge for transaction
            taxAmount: PaytmPCFDetailsResponseMoney;
        }
    }
}