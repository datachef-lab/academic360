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

interface PaytmMoney {
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
            baseTransactionAmount: PaytmMoney; // Transaction amount which is sent in the Initiate Transaction API request.
            feeAmount: PaytmMoney; // Extra charge for transaction
            taxAmount: PaytmMoney; // Tax amount for transaction
            totalConvenienceCharges: PaytmMoney; // Sum of the fee and the tax amount
            totalTransactionAmount: PaytmMoney; // Total transaction amount to be paid by a customer.
            text: string; // Extra charge with text
            displayText: string; // Mode Display Text
        }
    }
}



export interface PaytmBINDetailsRequest {
    head: {
        version?: string; // Version of the API. Example: v1
        requestTimestamp?: string; // EPOCH timestamp of the time at which request is being sent.
        channelId: string; // The parameter value identifies the Channel for which API call is initiated. Possible values: WEB , WAP
        tokenType: "ACCESS" | "CHECKSUM" | "TXN_TOKEN"; // Authorization method for this request. Possible values: ACCESS , CHECKSUM , TXN_TOKEN
        token: string; // Authorization string corresponding to the tokenType used.
    },
    body: {
        bin: string; // The first 9 digits of the card number or card token.
        mid: string; // Paytm provides MID as a unique identifier to each merchant. It becomes mandatory in case tokenType value is send as ACCESS in the request.
        paymentMode?: "CREDIT_CARD" | "DEBIT_CARD"; // The payment mode used by customer for transaction.
        emiType?: "CREDIT_CARD" | "DEBIT_CARD"; // The emi type used by customer for transaction.
        channelCode?: string; // Bank Code for which the EMI details are required
        txnType: string; // This parameter is used to identify the payment flow. Possible values: NONE , ADDANDPAY , HYBRID
        isEMIDetail?: string; // Returned in response, if the InitiateTxn request had requestType PAYMENT, NATIVE_SUBSCRIPTION
        cardPreAuthType?: string; // The type of Pre-Auth flow - Standard/Delayed that is to be used for the transaction. If not provided in this API the cardPreAuthType used in Access Token API can be used.
        requestType: string; // This parameter is used to identify the transaction flow. use 'NATIVE_SUBSCRIPTION' to check if subscription payments are available on a BIN or not.
        nativeOTPDetailRequired?: string; // This parameter is used to identify whether the bin supports Native OTP flow or not. Possible Values: true
    }   
}

export interface PaytmBINDetailsResponse {
    head: {
        version: string; // Version of the API passed in the request. Example: v1
        responseTimestamp: string; // EPOCH timestamp of the time at which response is being sent.
    },
    body: {
        resultInfo: { // This parameter gives the information about the result of the API response
            resultCode: string; // This is the resultCode corresponding to a particular message and is returned to the merchant. It's maximum length is 64. The different result codes corresponding to this API are mentioned.
            resultStatus: string; // This parameter indicates the status of API call. Possible Values: S, F, U
            resultMsg: string; // This parameter is the result message which contains information about the result.The different result messages corresponding to this API are mentioned
        },
        binDetail: { // BIN details like issuing bank name and card scheme (Visa/Master..) are provided here
            bin: string; // Bank Identification Number
            issuingBank: string; // issuing Bank
            issuingBankCode: string; // Bank Code
            paymentMode: string; // The payment mode used by customer for transaction. If it is 'EMI', we check for EMI details for a particular emiType and channelCode only.
            channelName: string; // Name of card scheme of the BIN
            channelCode: string; // Code of card scheme of the BIN
            cnMin: string; // Minimum card number digits
            cnMax: string; // Maximum card number digits
            cvvR: string; // CVV required or not. Possible Values: true, false
            cvvL: string; // CVV length
            expR: string; // Expiry required or not. Possible Values: true, false
            IsIndian: string; // Whether card is Indian or not
            IsActive: string; // BIN status. Possible Values: true, false
            countryCode: string; // The ISO 2-letter country code of the issuer. Example: IN
            countryName: string; // The full country name of the issuer. Example: India
            countryNumericCode: string; // The ISO 3-letter country code of the issuer. Example: 356
            currencyCode: string; // The ISO 4217 currency code associated with the country of the issuer. Example: INR
            currencyName: string; // The full currency name associated with the country of the issuer. Example: Rupee
            currencyNumericCode: string; // The ISO 3166 currency code associated with the country of the issuer. Example: 356
            currencySymbol: string; // The symbol of the currency associated with the country of the issuer. Example: ₹
            isEligibleForCoft: boolean; // Status whether bin is eligible for card on file tokenization or not.
            isCoftPaymentSupported: boolean; // Status whether bin supports token payment or not.
            isEligibleForAltId: boolean; // Status whether bin is eligible for alt id generation.
            isAltIdPaymentSupported: boolean; // Status whether bin supports alt id payment or not.
        },
        hasLowSuccessRate: { // Identifier to depict the low success rate on the payment mode/instrument in the past 15 minutes. If the success rate is low, the user should be communicated the same on the cashier page and motivated to choose a different payment instrument.
            status: boolean; // If the success rate is lower in last 15 minutes, then the value is returned as true
            msg: string; // Message to display the user about the low success rate
        },
        IsEmiAvailable: string; // Depicts, if the EMI is available on the selected BIN or not.
        supportedCardSubTypes: string[]; // Provides an identifier for various types of cards. Depending on your agreement, you can be charged differently for a different card. Example: CORPORATE_CARD which Indicates if the card used is a corporate card. Typically a merchant is charged differently for a prepaid card compared to a debit card.
        authModes: string[]; // Auth mode available on the BIN. Possible values: otp , atm
        iconUrl: string; // Icon URL of issuing bank of saved card
        errorMessage: string; //  Captures the error encountered
        isSubscriptionAvailable: boolean; // Depicts if subscription payments are available on this BIN or not. In case the value is true, then subscription payments are supported. Note: If TXN_TOKEN is used, It must be the same value as found in txnToken of Initiate Subscription API response.
        pcf: { // Post convenience fees if applicable
            feeAmount: PaytmMoney; // Post convenience fees
            taxAmount: PaytmMoney; // Total tax amount
            totalTransactionAmount: PaytmMoney; // Total txn amount after including pcf charges
        },
        extraParamsMap: Record<string, unknown>; // Map for any additional data that is required to be provided in the response.
        isHybridDisabled: boolean; // Specifies whether the Hybrid paymode is disabled on this card or not
        prepaidCard: boolean; // Indicates, if the card used is a prepaid card or not. Typically a merchant is charged differently for a prepaid card compared to a debit card. Possible Value: True, False
        prepaidCardMaxAmount: string; // Maximum amount of payment allowed on that prepaid card. Prepaid cards do not support payments beyond a threshold set by the bank. This is INR 1.0 Lakh.
        preAuthDetails: { // The pre-auth level details for the selected BIN and flow type.
            isDisbaled: boolean; // Returns if the selected Pre-Auth flow is disabled on the BIN 
            maxBlockSeconds: string; // The maximum time period for which the amount can be blocked in customers account for the selected BIN
            /*
            * The type of Pre-Auth flow - Standard/Delayed that is to be used for the transaction.
            *
            * Example : STANDARD_AUTH, DELAYED_AUTH
            *
            * STANDARD_AUTH : This pre-auth flow involves blocking of amount in the customer’s account to be captured/released at a later stage.
            *
            * DELAYED_AUTH : This flow involves no blocking of amount but only the authorization for this transaction is done at a later stage.
            */
            cardPreAuthType: string;
            nativeOtpEligible: string; // This parameter indicates if the Native OTP support is available on the requested BIN or not.
        }
    }
}