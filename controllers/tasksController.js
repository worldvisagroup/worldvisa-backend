const axios = require("axios");
require("dotenv").config();
const helperFunction = require("../utils/helperFunction");
const moment = require("moment");

const fetchAvailableSlots = async (data, token) => {
  const { serviceId, staffId, selectedDate } = data;

  const fetchAvailabilityUrl = `https://www.zohoapis.in/bookings/v1/json/availableslots?service_id=${serviceId}&staff_id=${staffId}&selected_date=${selectedDate.replace(
    " ",
    "%"
  )}`;

  try {
    const response = await axios.get(fetchAvailabilityUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });

    if (response.data.response.returnvalue.data === "Slots Not Available") {
      return [];
    }

    return response.data.response.returnvalue.data;
  } catch (err) {
    console.log("error", err);
    return [];
  }
};

const createAppointment = async (formData, token) => {
  const appointmentUrl = "https://www.zohoapis.in/bookings/v1/json/appointment";
  try {
    const response = await axios.post(appointmentUrl, formData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });
    console.log(response.data.response);
  } catch (err) {
    console.log("Error occured", err);
  }
};

const allStaff = [
  {
    name: "world visa",
    staffId: "71920000000021010",
  },
  {
    name: "amardeep",
    staffId: "71920000000709202",
  },
  {
    name: "anjana",
    staffId: "71920000000698150",
  },
  {
    name: "aswin",
    staffId: "71920000000956122",
  },
  {
    name: "jaya prakash",
    staffId: "71920000000956132",
  },
  {
    name: "jyothi rao",
    staffId: "71920000000110042",
  },
  {
    name: "nitin",
    staffId: "71920000000955084",
  },
  {
    name: "prejual",
    staffId: "71920000000308006",
  },
  {
    name: "rabab",
    staffId: "71920000000388095",
  },
  {
    name: "satish",
    staffId: "71920000000390032",
  },
  {
    name: "swapnil",
    staffId: "71920000000955092",
  },
];

const getAvailableSlot = async (token, staffId = 0, daysToAdd = 0, time) => {
  const data = {
    serviceId: "71920000001183134",
    staffId: allStaff[staffId].staffId,
    selectedDate: helperFunction.currentDateTime(daysToAdd, time),
  };

  console.log(data.selectedDate);

  const availableSlots = await fetchAvailableSlots(data, token);

  const isSlotTimeAvailable = helperFunction.compareTime(
    time,
    availableSlots[0]
  );

  console.log(availableSlots[0]);
  console.log(isSlotTimeAvailable);

  console.log("available slot time", isSlotTimeAvailable);

  if (availableSlots.length > 0) {
    return {
      time: availableSlots,
      date: moment(data.selectedDate, "DD-MMM-YYYY HH:mm:ss").format(
        "DD-MMM-YYYY"
      ),
      staffId: allStaff[staffId].staffId,
    };
  } else {
    if (staffId <= 9) {
      const incrementStaffId = staffId + 1;
      return getAvailableSlot(token, incrementStaffId, daysToAdd);
    } else {
      const updatedDaysToAdd = daysToAdd + 1;
      return getAvailableSlot(token, 0, updatedDaysToAdd);
    }
  }
};

const createCallTask = async (req, res) => {
  const { time } = req.body;

  const customerDetails = {
    name: "Hafeez",
    email: "hussainhafeez1100@gmail.com",
    phone_number: "8497048572",
  };

  const token = await helperFunction.fetchToken();
  console.log(token);
  // const slots = await getAvailableSlot(token, 0, 0, time);
  // const dateString = `${slots.date} ${moment(slots.time[0], "hh:mm A").format(
  //   "HH:mm"
  // )}:00`;

  // console.log(
  //   "Booking Appointment",
  //   "For Date: ",
  //   dateString,
  //   "Sales Exec",
  //   slots.staffId
  // );

  // const formData = new FormData();
  // formData.append("service_id", "71920000001183134");
  // formData.append("staff_id", slots.staffId);
  // formData.append("from_time", dateString);
  // formData.append("timezone", "Asia/Calcutta");
  // formData.append("customer_details", JSON.stringify(customerDetails));

  // await createAppointment(formData, token);

  res.json({ message: "OK" });
};

module.exports = {
  createCallTask,
};
