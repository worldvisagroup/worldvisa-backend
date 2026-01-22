const Razorpay = require("razorpay");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const helperFunctions = require("../utils/helperFunction");

const fetchToken = helperFunctions.fetchToken;
const searchLeads = helperFunctions.searchLeadsNew;


const contactData = (name, email, number) => {
  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_CONTACTS_LAYOUT_ID,
        },
        Last_Name: name,
        Email: email,
        Phone: number.toString(),
        trigger: [""],
        Lead_Source: "Website Pricing Page",
      },
    ],
  };
};

const leadData = (name, email, number) => {
  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_LAYOUT_ID,
        },
        Lead_Source: "Website Pricing Page",
        Lead_Status: "New Lead",
        Last_Name: name.toString(),
        Phone: number.toString(),
        Mobile: number.toString(),
        Email: `${email}`,
      },
    ],
  }
}

async function searchContact(email, phoneNumber, token) {
  try {
    const response = await axios.get(
      `https://www.zohoapis.in/crm/v5/Contacts/search?phone=${phoneNumber}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 204) {
      console.log('No contact found with that email.');
      // Handle the "not found" case, e.g., return an empty array or a specific message.
      return "";
    }

    if (response.data.data) {
      const id = response.data.data[0].id;
      console.log("find lead id", id);
      return id;
    }
  } catch (error) {
    console.log("error: ", error);
    const errorMessage = helperFunctions.zohoErrorHandler(error);
    console.log(errorMessage);
    return "";
  }
}

const booksContactPayload = (name, email, phone, address) => {
  return {
    contact_name: name,
    billing_address: {
      address: address,
      phone: phone,
    },
    contact_type: "customer",
    website: "worldvisagroup.com",
    contact_persons: [
      {
        "first_name": name,
        "last_name": name,
        email: email,
        phone: phone,
        mobile: phone,
        is_primary_contact: true,
      },
    ],
  };
};

invoicePayloadData = (customerId, contactPersonId, amount, item_ids) => {
  const line_items = item_ids.map(item_id => ({
    item_id: item_id,
    tax_id: "445172000000495147",
    quantity: "1",
    product_type: "goods",
    hsn_or_sac: "070991",
  }));

  return {
    customer_id: customerId,
    template_id: "445172000000010128",
    line_items: line_items,
    payment_made: amount,
    payment_options: {
      payment_gateways: [
        {
          configured: true,
          additional_field1: "standard",
          gateway_name: "razorpay",
        },
      ],
    },
    can_send_in_mail: true,
    contact_persons: [contactPersonId],
  };
};

const dealApiDataFn = (
  name,
  email,
  number,
  country,
  package,
  service,
  contactId,
  amount
) => {
  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_DEALS_LAYOUT_ID,
        },
        Account_Name: { name: name },
        Contact_Name: {
          name,
          id: contactId ? contactId : "164193000029633190",
        },
        Closing_Date: new Date().toISOString().split("T")[0],
        Amount: parseInt(amount),
        Deal_Name: `${name}_${new Date().toISOString().split("T")[0]
          }`,
        // PR
        Service_Finalized: service,
        Package_Finalize: package,
        Stage: "Qualification",
        trigger: ["approval"],
        Email_1: email,
        First_name: name,
        Phone: number.toString(),
        Country_Finalized: country,
      },
    ],
  };
};

const createContactFn = async (contactsData) => {
  let contactLeadId = "";
  try {
    const token = await fetchToken();

    const response = await axios.post(
      "https://www.zohoapis.in/crm/v5/Contacts",
      JSON.stringify(contactsData),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 201) {
      contactLeadId = response.data.data[0].details.id;
    }

    if (response.status === 400) {
      console.log("Searching for user in the contacts");
    }

    console.log("Successfully created record on cantacts");
    return contactLeadId;
    // Create a new Deal /Deal
    // Required Fields: Deal Name - Deal_Name, Account Name - Account_Name, Closing Date - Closing_Date, Stage - Stage, Amount - Amount, Contact_Name - Contact_Name
  } catch (err) {
    console.log('err: ', err.response.data.data)
    const errorMessage = helperFunctions.zohoErrorHandler(err);
    console.log("errorMessage: ", errorMessage)
    return contactLeadId;
  }
};

const createCrmLead = async (apiData) => {
  try {
    const token = await fetchToken();

    await axios.post(
      "https://www.zohoapis.in/crm/v5/Leads",
      JSON.stringify(apiData),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return true;
  } catch (err) {
    return false;
  }
};

const digestFn = (orderCreationId, razorpayPaymentId) => {
  // Creating our own digest
  // The format should be like this:
  // digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_TESTING_KEY_SECRET);

  shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

  const digest = shasum.digest("hex");

  return digest;
};

const createDeal = async (dealApiData, token) => {
  try {
    await axios.post(
      "https://www.zohoapis.in/crm/v5/Deals",
      JSON.stringify(dealApiData),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Successfully created deals");
    return true;
  } catch (err) {
    console.log('err: ', err)
    console.log('err: ', err.response.data)
    const errorMessage = helperFunctions.zohoErrorHandler(err);
    console.log("errorMessage: ", errorMessage);
    return false;
  }
};

const searchContacts = async (contactId, token) => {
  try {
    const createContactUrl =
      `https://www.zohoapis.in/books/v3/contacts/${contactId}?organization_id=60007083365`;

    const contactResponse = await axios.get(
      createContactUrl,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contactObj = {
      contactId: contactResponse.data.contact.contact_id,
      contactPrimaryId:
        contactResponse.data.contact.contact_persons[0].contact_person_id,
    };
    console.log("Successfully fetched Contact on zoho books");
    return contactObj;
  } catch (error) {
    return "Error occured fetching book contact";
  }
};

const createBookContact = async (contactApiData, token) => {
  try {
    const createContactUrl =
      "https://www.zohoapis.in/books/v3/contacts?organization_id=60007083365";

    const contactResponse = await axios.post(
      createContactUrl,
      JSON.stringify(contactApiData),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contactObj = {
      contactId: contactResponse.data.contact.contact_id,
      contactPrimaryId:
        contactResponse.data.contact.contact_persons[0].contact_person_id,
    };

    console.log("Successfully created Contact on zoho books");
    return contactObj;
  } catch (error) {
    const errorMessage = helperFunctions.zohoErrorHandler(error);
    console.log('errorMessage: ', errorMessage)
    return false;
  }
};

const createInvoice = async (invoiceData, token) => {
  const invoiceUrl =
    "https://www.zohoapis.in/books/v3/invoices?organization_id=60007083365";
  try {
    const response = await axios.post(invoiceUrl, JSON.stringify(invoiceData), {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
        "X-com-zoho-invoice-organizationid": "60007083365",
      },
    });

    const invoiceId = response.data.invoice.invoice_id;
    const date = response.data.invoice.date;
    const total = response.data.invoice.total;

    console.log("Successfully created Invoice in Zoho books");
    return { invoiceId, date, total };
  } catch (err) {
    console.log('err: ', err)
    const errorMessage = helperFunctions.zohoErrorHandler(err);
    console.log("errorMessage: ", errorMessage)
    return false;
  }
};

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
    contact_persons: [contact_person_id],
  };
};

const emailInvoicePayload = (contacts, contact_id) => {
  return {
    contacts: [
      {
        contact_id: contact_id,
        email: true,
        snail_mail: false,
      },
    ],
  };
};

const sendSuccessInvoice = async (token, invoiceIds, emailPayload) => {
  const sendInvoiceURL = `https://www.zohoapis.in/books/v3/invoices/email?invoice_ids=${invoiceIds}&organization_id=60007083365`;

  try {
    const response = await axios.post(
      sendInvoiceURL,
      JSON.stringify(emailPayload),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
          "X-com-zoho-invoice-organizationid": "60007083365",
        },
      }
    );

    console.log("Success Invoice sent");
    return true;
  } catch (error) {
    const errorMessage = helperFunctions.zohoErrorHandler(error);
    console.log("Error Message: ", errorMessage);
    return false;
  }
};

const recordPayment = async (paymentData, token) => {
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

    console.log("Successfully Recorded the Payment for the Invoice");
    return true;
  } catch (err) {
    const errorMessage = helperFunctions.zohoErrorHandler(err);
    console.log('errorMessage: ', errorMessage);

    return false;
  }
};

const createPaymentOrder = async (req, res) => {
  // retrieving user data from the http post request
  const { price, name, email, number } = req.body;

  try {
    console.log("RAZORPAY_TESTING_KEY_ID exists:", process.env.RAZORPAY_TESTING_KEY_ID !== undefined);
    console.log("RAZORPAY_TESTING_KEY_SECRET exists:", process.env.RAZORPAY_TESTING_KEY_SECRET !== undefined);
    // Razorpay create order instance
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_TESTING_KEY_ID,
      key_secret: process.env.RAZORPAY_TESTING_KEY_SECRET,
    });

    const options = {
      amount: price * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${name}_${price}`,
    };

    // contact api data
    // const contactsData = contactData(name, email, number);
    // Creating Contact record in zoho - Don't create contant yet.
    // let contactLeadId = await createContactFn(contactsData);

    // parse lead data
    const parsedLeadData = leadData(name, email, number)
    // Create lead in crm
    let leadLeadId = await createCrmLead(parsedLeadData)

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json({ ...order, contact_record_id: leadLeadId });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const getItemId = (amount, country) => {
  if (country === "australia" && amount === 23598.82) {
    // australia basic package
    return "445172000003366001";
  } else if (country === "australia" && amount === 61359.82) {
    // australia advance package
    return "445172000008069001";
  } else if (country === "australia" && amount === 147498.82) {
    // australia premium package
    return "445172000004394022";
  } else if (country === "canada" && amount === 23598.82) {
    // canada basic package
    return "445172000006245041";
  } else if (country === "canada" && amount === 61359.82) {
    // canada advance package
    return "445172000008069010";
  } else if (country === "canada" && amount === 147498.82) {
    // canda premium package
    return "445172000004543001";
  } else {
    return "445172000005731154";
  }
};

const getPriceWithFloat = (amount) => {
  if (amount === 23599) {
    return 23598.82;
  } else if (amount === 61360) {
    return 61359.82;
  } else if (amount === 147499) {
    return 147498.82;
  } else {
    return Number(amount);
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount,
      contactLeadId,
      name,
      email,
      number,
      country,
      package,
      service,
      itemId,
      itemsData
    } = req.body;

    if (!itemsData || itemsData.length === 0) {
      return res.status(500).json({ msg: "No zoho items data provided." });
    }

    const digest = digestFn(orderCreationId, razorpayPaymentId);

    const token = await fetchToken();


    // comaparing our digest with the actual signature
    if (digest !== razorpaySignature)
      return res.status(400).json({ msg: "Transaction not legit!" });
    let contactId = null;


    // search if contact already exsits - currently only using number to search
    const userContactId = await searchContact(email, number, token);
    contactId = userContactId;

    if (!contactId) {
      const parsedContactData = contactData(name, email, number);
      contactId = await createContactFn(parsedContactData);
    }

    if (!contactId) {
      return res.status(500).send("Contact does not exist");
    }


    const totalAmount = itemsData.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = totalAmount * 0.18;
    const totalAmountWithTax = totalAmount + taxAmount;

    // THE PAYMENT IS LEGIT & VERIFIED
    // YOU CAN SAVE THE DETAILS IN YOUR DATABASE IF YOU WANT
    const dealApiData = dealApiDataFn(
      name,
      email,
      number,
      country,
      package,
      service,
      contactId,
      totalAmountWithTax
    );

    const dealResponse = await createDeal(dealApiData, token);

    if (!dealResponse) {
      return res.status(500).send("Error Occured creating deals.")
    }

    // Create Contact in zoho books
    const booksContactData = booksContactPayload(name, email, number, country);

    const booksContactId = await createBookContact(booksContactData, token);

    if (!booksContactId) {
      return res.status(500).send("Error Occured creating Zoho Books Contact.")
    }

    const packageAmount = totalAmountWithTax;

    const itemsIds = itemsData.map(item => item.itemId);

    if (itemsIds.length === 0) {
      return res.status(500).send("Error: Zoho items found.");
    }

    const invoiceData = invoicePayloadData(
      booksContactId.contactId,
      booksContactId.contactPrimaryId,
      packageAmount,
      itemsIds
    );

    const invoiceResponse = await createInvoice(invoiceData, token);

    const invoiceTotal = invoiceResponse.total;
    console.log('invoiceTotal: ', invoiceTotal)

    if (invoiceTotal !== packageAmount) {
      return res.status(500).send("Error: Invoice total does not match package amount.");
    }

    if (!invoiceResponse) {
      return res.status(500).send("Error Occured Creating an Invoice")
    }

    const paymentData = recordPaymentPayload(
      booksContactId.contactId,
      "others",
      packageAmount,
      invoiceResponse.date,
      invoiceResponse.invoiceId,
      packageAmount,
      booksContactId.contactPrimaryId
    );

    const recordPaymentResponse = await recordPayment(paymentData, token);

    if (!recordPaymentResponse) {
      return res.status(500).send("Error Occured Recording the payment for the invoice")
    }

    const emailInvoiceData = emailInvoicePayload(
      booksContactId.contactPrimaryId,
      booksContactId.contactId
    );

    // sending the success invoice
    const successInvoiceResponse = await sendSuccessInvoice(token, invoiceResponse.invoiceId, emailInvoiceData);

    if (!successInvoiceResponse) {
      return res.status(500).send("Error occured sending the success invoice")
    }

    console.log("Done!");

    res.json({
      msg: "success",
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    console.log(error);
    const errorMessage = helperFunctions.zohoErrorHandler(error);
    console.log("Error Message: ", errorMessage);
    res.status(500).send(error);
  }
};

module.exports = {
  createPaymentOrder,
  paymentSuccess,
};