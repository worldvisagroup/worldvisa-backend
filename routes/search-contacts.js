app.post("/search-contacts", async (req, res) => {
  const { name, email, number } = req.body;
  console.log("started searching", email);

  try {
    const token = await fetchToken();
    const query = {
      select_query: `select email from Contacts
        where email = ${email}
        limit 1`,
    };

    const response = await axios.post(
      `https://www.zohoapis.in/crm/v5/coql`,
      JSON.stringify(query),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("got", response.data);

    res.json({ message: "success" });
  } catch (err) {
    console.log("not", err);
    res.json({ message: "failed", err });
  }
});
