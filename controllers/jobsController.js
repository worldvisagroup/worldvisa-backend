require("dotenv").config();
const axios = require("axios");

const getAllJobs = async (req, res) => {
  const { page, jobLocation, jobTitle } = req.body;

  try {
    const jobsUrl = `${process.env.ADZUNA_API_URL}/jobs/${jobLocation}/search/${page}?app_id=${process.env.ADZUNA_JOBS_APP_ID}&app_key=${process.env.ADZUNA_JOBS_APP_KEY}&what=${jobTitle}&results_per_page=12`;

    const jobs = await axios.get(jobsUrl);

    const jsonData = await jobs.data;

    if (jsonData) {
      res.status(200).json({ jobs: jsonData.results, results: jsonData.count });
    } else {
      res.status(404).json([]);
    }
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
};

const getJobsWorth = async (req, res) => {
  const { title, description, country } = req.body;

  try {
    const jobsWorthUrl = `${process.env.ADZUNA_API_URL}/jobs/${country}/jobsworth?app_id=${process.env.ADZUNA_JOBS_APP_ID}&app_key=${process.env.ADZUNA_JOBS_APP_KEY}&title=${title}&description=${description}&content-type=application/json`;

    const fetchJobsWorth = await axios.get(jobsWorthUrl);

    const jsonData = await fetchJobsWorth.data;

    if (jsonData) {
      res.status(200).json({ data: jsonData });
    } else {
      res.status(404).json({});
    }
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
};

module.exports = {
  getAllJobs,
  getJobsWorth,
};
