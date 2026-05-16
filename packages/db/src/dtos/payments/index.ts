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


export interface PaytmTransactionStatusRequest {
    head: {
        version?: string; // Version of the API. Example: v1
        channelId?: string; // The parameter value identifies the Channel for which API call is initiated. Possible values: WEB , WAP
        requestTimestamp?: string; // EPOCH timestamp of the time at which request is being sent.
        clientId?: string; // Paytm use the merchant key on the basis of clientId parameter value. It requires only if the merchant has more than one key. Example: C11
        signature: string; // Paytm validates the request and ensures that parameters are not tempered by verifying the signature in the request. Note: Create the signature using the body parameter of the request.
    },
    body: {
        mid: string; // Paytm provides MID as a unique identifier to each merchant. You get the production MID post the account activation.
        orderId: string; // The Unique reference ID of the Order. It is alphanumeric and special characters allowed are “@” “-” “_” “.”.
        /**
         * Transaction type of the payment

            The parameter that would define which status will be presented in the response. 
            If value = PREAUTH the status and  amount in response would be that of pre-auth 
            If value = CAPTURE the status and  amount in response would be that of capture
            If value = RELEASE the status and  amount in response would be that of release
            If value is blank then order amount and status will be provided in response

            Possible Values: PREAUTH, RELEASE, CAPTURE, WITHDRAW
         */
        txnType?: string;
    }
}

export interface PaytmTransactionStatusResponse {
    head: {
        version: string; // Version of the API passed in the request.
        responseTimestamp: string; // EPOCH timestamp of the time at which response is being sent.
        channelId: string; // The parameter value identifies the Channel for which API call is initiated. Possible values: WEB , WAP
        clientId: string; // Paytm use the merchant key on the basis of clientId parameter value. It requires only if the merchant has more than one key. Example: C11
        signature: string; // Paytm validates the request and ensures that parameters are not tempered by verifying the signature in the request. For creating the checksum (signature) refer to the steps given in Checksum Logic. Note: Create the signature using the body parameter of the request.
    },
    body: {
        resultInfo: {
            resultCode: string; // This is the resultCode corresponding to a particular message and is returned to the merchant. It's maximum length is 64. 
            resultStatus: string; // This parameter is the result specific to the phase of the transaction mentioned in the txnType field. Possible Values: TXN_SUCCESS, TXN_FAILURE, PENDING, NO_RECORD_FOUND
            resultMsg: string; // This parameter is the result message which contains information about the result.
        },
        txnId: string; // Transaction Id of the payment
        bankTxnId: string; // Bank transaction Id from the bank
        orderId: string; // Unique reference ID for an Order request generated by merchant for payment.
        txnAmount: string; // Payment transaction amount
        txnType: string; // Transaction type of the payment
        gatewayName: string; // Name of the gateway used to process the transaction. In case of Super Router, this is the payment aggregator chosen to process the transaction.
        gatewayInfo: string; // Response provided by the gateway during payment or transaction. This is available for Super Router product only.
        /**
         * Bank Name used in payment

            Example: Paytm Payments Bank

            Example: ICICI Bank
         */
        bankName: string;
        mid: string; // Paytm provides MID as a unique identifier to each merchant. You get the production MID post the account activation.
        paymentMode: string; // Payment Mode used in payment. Possible values: PPI , UPI , CC , DC , NB
        refundAmt: string; // refund amount of the payment. Example: 1.00
        txnDate: string; // Date on which the pre-auth/capture/release/order was created (depending on the value of txnType) . Example: 2020-05-05 14:00:28
        subsId: string; // Subscription ID - Only Subscription flow
        payableAmount: string; // Original order value before offer was applied. Only for SimplifiedPaymentOffers (Bank Offers).
        /**
         * Only for SimplifiedPaymentOffers (Bank Offers).
            promocode: Actual promocode which got applied
            promotext: Promo message
            savings: Benefit amount
            redemptionType: discount/cashback
         */
        paymentPromoCheckoutData: string;
        vanInfo: { // VAN account details. This is only provided for bank account transfer paymode.
            van: string; // Virtual Account Number. This is the 16 alphanumeric account number to which customer has initiated the transfer. Example: PY2222K735789128.
            beneficiaryName: string; // Beneficiary name of the VAN
            ifscCode: string; // Ifsc code of van account. Example: PYTM0123456
            bankName: string; // Bank in which VAN is created
            purpose: string; // Purpose of the txn. Example: Dont
            userDefinedFields: { // Object containing five types of udf passed at the time of VAN creation. This is only provided for bank account transfer.
                udf1: string;
                udf2: string;
                udf3: string;
                udf4: string;
                udf5: string;
            };
            customerDetails: {
                name: string; // Name of the person who initiated refund
                email: string; // Valid email of the user.
                phone: string; // Phone number of end user
            }
        },
        sourceAccountDetails: { // Remitter/Source account detail information from where the money has been received. This is only provided for bank account transfer.
            maskedAccountNumber: string; // Account number of customer. Example: 915555**0164
            accountHolderName: string; // Account holder name
            ifscCode: string; // Ifsc code of bank. Example: BACB0000003
        },
        transferMode: string; // Mode by which remitter has made the transfer. Possible values are IMPS, NEFT, RTGS, and XFER. This is only provided for bank account transfer.
        utr: string; // Unique transaction reference number from bank. This is only provided for bank account transfer. Example: 5R01IY000V27.
        bankTransactionDate: string; // Timestamp at which partner bank received the payment. This is only provided for bank account transfer. Example: 2020-09-25 11:35:07.0.
        rrnCode: string; // Reference number which is also generated by the bank. Example: 777001344756752
        /**
         * Unique Reference Number generated by the Acquirer Bank for Visa, Master and Rupay networks that indicates the settlement between the acquirer and card issuing bank is complete.

            Please note ARN is 23 digit number typically starting with 3, 7 or 8 and is not the same as RRN (Retrieval Reference Number).

            Example: 74056633031820896327619
         */
        arnCode: string;
        arnAvailable: boolean; // Indicates the eligibility of ARN for card transactions. 
        authCode: string; // Authentication code which comes from the bank. Example: 123456
        merchantUniqueReference: string; // Merchant's reference text which is sent in the order's request
        cardScheme: string; // Card Scheme. Example: VISA, MASTER
        lastFourDigit: string; // Last four digit of the card. Example: 0208
        /**
         * Details of the payment done through dcc

            Note: For currency conversion flow only
         */
        dccPaymentDetail: {
            dccId: string; // There is an ID generated corresponding to each request by the bank. Example: 79755374
            amountPerUnitForeignAmount: string; // Exchange Rate = FC/INR. Example: 10471.2
            foreignCurrencyCode: string; // 3 letter currency code corresponding to a currency. Example: EUR
            foreignCurrencySymbol: string; // Currency symbol corresponding to the selected currency. Example: €
            foreignPayableAmount: string; // Total Amount paid in Foreign Currency (including markup). Example: 2.00
            foreignPaymentAmount: string; // Total Amount paid in Foreign Currency(excluding markup). Example: 1.91
            foreignMarkupAmount: string; // Markup amount charged by a gateway from the user calculated by PG. Example: 0.09
            foreignMarkupRatePercentage: string; // Markup % charged by a gateway from the user. Example: 4.5
            expirationTimestamp: string; // Standard format timestamp for foreign exchange rate validity. Example: 2021-06-29T06:36:38.000+02:00
            isoForeignCurrencyCode: string; // 3 digit ISO Currency code corresponding to the selected currency. Example: 978
            dccOffered: string; // The flag indicates if the currency conversion option was selected by the customer. Possible Values: true, false
            foreignCurrencyName: string; // Currency name corresponding to the selected currency. Example: EURO
            exchangeRateSourceName: string; // Name of the source providing the currency exchange rate. Example: REUTERS WHOLESALE INTERBANK

        },
        /**
         * Indicates if the transaction was completed using an international card (issued by a non-indian bank)

            Note: For currency conversion flow only

            Possible Values: true
         */
        internationalCardPayment: boolean;
        /**
         * Base currency used for currency conversion and is always INR.

            Note: For currency conversion flow only

            Example: INR
         */
        baseCurrency: string;
        /**
         * The fee factor DCC indicates that DCC fee/commission is applicable for the given international card transaction.

            Note: For currency conversion flow only
         */
        feeRateFactors: {
            internationalCardPayment: string; // Indicates if the transaction was completed using an international card (issued by a non-indian bank). Possible Values: TRUE
            dcc: string; // Indicates if the transaction was completed using the dcc flow. Possible Values: TRUE, FALSE
        },
        preAuthId:  string; // In case of pre-auth transactions this parameter will provide the pre-authId specific to the transaction
        blockedAmount: string; // This field will have the value of the amount blocked in the customer’s account in case the txnType = PREAUTH
        /**
         * The type of Pre-Auth flow - Standard/Delayed that is to be used for the pr-auth transaction

            Example : STANDARD_AUTH, DELAYED_AUTH

            STANDARD_AUTH : This pre-auth flow involves blocking of amount in the customer’s account to be captured/released at a later stage.

            DELAYED_AUTH : This flow involves no blocking of amount but only the authorization for this transaction is done at a later stage.
         */
        cardPreAuthType: string;
        authRefId: string; // Authentication ID for the 2FA transaction generated as received from the acquirer. Condition: To be provided mandatory for RupayCards.
    }
}

// Payout Level Based on Payout Date
export interface PaytmSettlementDetailsPayoutDateRequest {
    head: {
        reqMsgId: string; // The request message id. Example : 9b688fce-c59f-4ead-9677-c38a43e3ab59
    },
    body: {
        mid: string; // Unique merchantId. Example. HelloM8xxxxxxxx45
        startDate: string; // Date from which merchant wants to check the settlement data. Example. 2022-07-06
        endDate: string; // Date upto which merchant wants to check the settlement data. Note: Maximum Date Range supported is 1 week. Example. 2022-07-06
        pageNum: number; // Current page number. Example. 1
        pageSize: number; // the size of one pageNote : Maximum Page Size is 20. Example. 20
    }
}

// Payout Level Based on Payout Date
export interface PaytmSettlementDetailsPayoutIdRequest {
    head: {
        reqMsgId: string; // The request message id. Example : 9b688fce-c59f-4ead-9677-c38a43e3ab59
    },
    body: {
        mid: string; // Unique merchantId. Example. HelloM8xxxxxxxx45
        payoutId: string; // Payout ID for the bank transfer made. Example. ALL2xxxxxxxxxxxxxxx911
        pageNum: number; // Current page number. Example. 1
        pageSize: number; // the size of one pageNote : Maximum Page Size is 20. Example. 20
    }
}

export interface PaytmSettlementDetailsResponse {
    head: {
        reqMsgId: string; // he request message id. Example : 9b688fce-c59f-4ead-9677-c38a43e3ab59
        respTime: string; // 	Time at which response is being sent. Example : 2022-09-09T11:26:17+05:30
    },
    body: {
        mid: string; // Unique merchantID. Example. HelloM8xxxxxxxx45
        payoutId: string; // Unique ID generated at the time of payout. Example: ALL2xxxxxxxxxxxxxxx911
        /**
         * 	Unique Paytm transaction ID issued by Paytm for each transaction
            Example: 2022xxxxxxxxxxxxxxxx95
         */
        transactionId: string;
        orderId: string; // Unique reference ID for a transaction generated by merchant. Example: 202xxxxxxxxxx098
        merchantUniqueRef: string; // Instrument specific Information : Link IDs, Subcription IDs, Invoice IDs. Example: 28XXXXXXXXXXQB3G
        transactionDate: string; // Date of transaction. Example: 2022-07-05T11:11:43+05:30
        updatedDate: string; // Time when transaction details were updated. Example: 2022-07-05T11:11:44+05:30
        transactionType: string; // Types of transactions - ACQUIRING, REFUND, CHARGEBACK, REPAYMENT etc. Example: ACQUIRING
        status: 'SUCCESS' | 'PENDING' | 'FAILURE'; // Status of transaction - 'SUCCESS', 'PENDING', 'FAILURE'. Example: SUCCESS
        merchantName: string; // Name of the merchant. Example:  XXXX Limited
        customerId: string; // Customer ID of transaction. Example: 53xxxxx4
        nickName: string; // Customer Name. Example: XXXXXX
        customerPhoneNo: string; // Customer phone number. Example: 90****4041
        customerEmailId: string; // Customer email ID.  Example: vijay*********@gmail.com
        amount: string; // Pre Unsettled Amount of each transaction. Example: 2.00
        commission: string; // Commission charged by PG on each transaction. Example: 0.0
        gst: string; // Service tax charged by PG on each transaction. Example: 0.0
        settledAmount: string; // Amount Settled to merchant bank account. Example: 2.00
        channel: string; // Channel used for payment. Example: AP_WAP
        utrNo: string; // Unique Reference Number of each transaction. Example: 21xxxxxxxx04
        payoutDate: string; // Date of payout generation. Example: 2022-07-06T00:00:00+05:30
        settledDate: string; // Date when settlement amount is transferred to merchant bank account. Example: 2022-07-06T04:38:46+05:30
        paymentMode: string; // Instruments of payment used by customers.Example: UPI, BALANCE
        issuingBank: string; // Issuer bank of customer. Example: XXXX Bank
        merchantBillId: string; // It is merchant POS order ID
        bankTransactionId: string; // Unique ID sent by the bank. Example: 20xxxxxxxx66
        referenceTransactionId: string; // Reference Transaction ID
        merchantRefId: string; // Unique transaction identifier generated by merchant
        prn: string; // Payment Reference Number
        acquiringFee: string; // Acquiring fee charged by Paytm for each transaction. Example: 0.0
        platformFee: string; // Platform fee charged by Paytm for each transaction. Example: 0.0
        acquiringTax: string; // Tax charged by Paytm for each acquiring transaction. Example: 0.0
        platformTax: string; // Platform fee charged by Paytm for each transaction. Example: 0.0
        ifscCode: string; // IFSC Code of bank to which settlement amount is transferred
        bankName: string; // Name of the bank in which settlement is done ( Merchant bank )
        beneficiaryName: string; // Beneficiary Name ( Merchant Name)
        maskedCardNo: string; // Card Number of customer in masked format
        cardNetwork: string; // Card Network of customer. Example: MASTER
        rrnCode: string; // Refund Retrieval Number
        disputeId: string; // Unique ID incase of dispute transactions
        posId: string; // Unique ID of each edc machine
        extSerialNo: string; // Unique serial number of each edc. Example: 2022xxxxxxxxxxxxxx68
        gateway: string; // Gateway used for transaction. Example: PPBXXX
        commissionRate: string; // Commission Rate Charged by PG
        productCode: string; // Unique code of Product
        requestType: string; // Source used for payment. Example: NATIVE etc.
        feeFactor: string; // Fee Factor. Example: solutionWiseMdr=API;Scheme=UPI; Bank=PPBLC;
        van: string; // Virtual Account Number

    }
}


export interface PaytmPaymentOptionRequest {
    head: {
        version?: string; // Version of the API. Example: v1
        requestTimestamp?: string; // EPOCH timestamp of the time at which request is being sent.
        channelId: string; // The parameter value identifies the Channel for which API call is initiated. Possible values: WEB , WAP
        tokenType: string; // Authorization method for this request. Possible values: ACCESS , CHECKSUM , TXN_TOKEN
        token: string; // Authorization string corresponding to the tokenType used.
    },
    body: {
        "origin-channel"?: string; // Channels of the merchants which are using Paytm's UPI PUSH sdk. Example: PAYTMTEST
        mid: string; // Paytm provides MID as a unique identifier to each merchant. It becomes mandatory in case tokenType value is send as ACCESS in the request.
        deviceId?: string; // Device Id, which will be passed to UPI in FetchProfile call and Payment call in case of Txns from UPI PUSH SDK. Example: 9140703226
        orderId?: string; // Unique reference ID of the order for which payment options are being requested. It is alphanumeric and special characters allowed are “@” “-” “_” “.”.
        returnToken?: boolean; // To get saved Token Reference IDs in this API response. Possible Value: true, false
        deepLinkRequired?: boolean; // To get subscription QR (UPI) deeplink in this API response
    }
}

export interface TmpPaytmPaymentOptionResponse {
    head: {
        resultCode: string; // This is the resultCode corresponding to a particular message and is returned to the merchant. It's maximum length is 64. The different result codes corresponding to this API are mentioned.
        resultStatus: string; // This parameter indicates the status of API call. Possible Values: S, F, U
        resultMsg: string; // This parameter is the result message which contains information about the result.The different result messages corresponding to this API are mentioned.
        isRedirect: boolean; // This flag indicates that number of retries are over and user is to be redirected from cashier page.
        bankRetry: boolean; // This flag indicates that retry is allowed at bank's end or not.
        retry: boolean; // This flag indicates that retry is allowed at bank's end or not.
    },
    body: {
        merchantDetails: {
            mcc: string; // mcc of the merchant. Example: 1234
            merchantVpa: string; // Virtual payment address of the merchant. Example: 7777777777@paytm
            merchantName: string; // Name of the merchant. Example: Test MID One
            merchantLogo: string; // Merchant profile image URL
        };
        addMoneyMerchantDetails: {
            mcc: string; // mcc of the merchant. Example: 1234
            merchantVpa: string; // Virtual payment address of the merchant. Example: 7777777777@paytm
            merchantName: string; // Name of the merchant. Example: Test MID One
            merchantLogo: string; // Merchant profile image URL
        }
    }
}

export * from "./paytm-downtime.dto.js";