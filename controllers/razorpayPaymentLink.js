const axios = require("axios");
require("dotenv").config();
const helperFunctions = require("../utils/helperFunction");
const { error } = require("pdf-lib");


const fetchToken = helperFunctions.fetchToken;

const recordPaymentPayload = (
    customer_id,
    payment_mode = "others",
    amount,
    date,
    invoice_id,
    amount_applied,
    contact_person_id
) => {
    return {
        customer_id: customer_id,
        payment_mode: payment_mode,
        amount: amount,
        date: date,
        invoices: [
            {
                invoice_id: invoice_id,
                amount_applied: amount_applied,
            },
        ],
        invoice_id: invoice_id,
        amount_applied: amount_applied,
        contact_persons: contact_person_id,
    };
};

function getCurrentDateFormatted() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const recordPayment = async (paymentData) => {
    const token = await fetchToken();

    const recordPaymentUrl = `https://www.zohoapis.in/books/v3/customerpayments?organization_id=60007083365`;

    try {
        const response = await axios.post(
            recordPaymentUrl,
            JSON.stringify(paymentData),
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log(response);
        return response;
    } catch (err) {
        console.log(err);
        return "";
    }
};

function convertPaisaToRupees(paisa) {
    return paisa / 100;
}

const getPaymentLinkResp = async (req, res) => {
    try {

        const paymentLinkDetails = req.body.payload;
        console.log("HIT")

        const ids = paymentLinkDetails.payment_link.entity.description;
        const createdAt = getCurrentDateFormatted();
        const amountPaid = paymentLinkDetails.payment_link.entity.amount_paid;

        const paymentMethod = paymentLinkDetails?.payment?.entity?.method;

        const { invoice_id, contact_person_id, customer_id } = JSON.parse(ids);

        const paymentPayload = recordPaymentPayload(
            customer_id,
            paymentMethod,
            convertPaisaToRupees(amountPaid),
            createdAt,
            invoice_id,
            convertPaisaToRupees(amountPaid),
            contact_person_id
        )

        await recordPayment(paymentPayload)

        res.send("API is working!");
    } catch (err) {
        res.status(400).json({ message: "Error Occured", error: err })
    }
}

module.exports = {
    getPaymentLinkResp,
};