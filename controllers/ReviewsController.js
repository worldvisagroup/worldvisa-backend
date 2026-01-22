const Review = require("../models/reviews");
const ReviewBackup = require("../models/reviewsBackup");
const helperFunction = require("../utils/helperFunction");


const getAllReviews = async (req, res) => {
  const querySource = req.query.source;
  const queryService = req.query.service;
  const queryCountry = req.query.country;
  const queryVisa = req.query.visa;
  const give = req.query.give;
  const sortBy = req.query.sortBy;
  const includes = req.query.includes;

  let filter = {};
  let sort = {};
  let includesObj = {};


  if (includes) {
    includesObj = { [includes]: { "$exists": true, $ne: "" } }
  }


  if (sortBy) {
    sort = { "review_date": Number(sortBy) }
  }

  if (querySource) {
    filter = { source: new RegExp(querySource, "i") };
  }

  if (queryService) {
    filter = { ...filter, service: new RegExp(queryService, "i") };
  }

  if (queryCountry) {
    filter = { ...filter, country: new RegExp(queryCountry, "i") };
  }

  if (queryVisa) {
    filter = { ...filter, visa: new RegExp(queryVisa, "i") };
  }

  Review.find(filter).sort(sort).find(includesObj)
    .limit(give === "all" || give === undefined ? 0 : 10).then((result) => {
      res.send(result);
    }).catch((error) => {
      res.send(error);
    });
};

const aggregateReviews = async (req, res) => {
  Review.find().then((result) => {
    const totalRatings = helperFunction.getAverageRatings(result);

    res.json({ totalReviews: result.length, totalRatings: totalRatings });
  }).catch((error) => {
    res.send(error);
  });

}

const createReview = async (req, res) => {
  const {
    review,
    source,
    source_link, image_reference, link_reference,
    service, country, visa,
    user_name,
    user_occupation,
    user_image,
    application_handled_by,
    ratings,
    review_date
  } = req.body;

  const parsedReview = {
    review, source, source_link, image_reference, link_reference, service, country, visa, user_name,
    user_occupation, user_image, ratings, application_handled_by, review_date
  }

  Review.create(parsedReview).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.send(error);
  });
  try {
    ReviewBackup.create(parsedReview);
    console.log("Review Backup Created");
  } catch (err) {
    console.log("Error: Review Backup", err);
  }
};

const updateReview = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.send("Review `Id` is Required");
  }

  const {
    review,
    source,
    source_link, image_reference, link_reference,
    service, country, visa,
    user_name,
    user_occupation,
    user_image,
    ratings,
    application_handled_by,
    review_date
  } = req.body;


  const parsedReview = {
    review, source, source_link, image_reference, link_reference, service, country, visa, user_name,
    user_occupation, user_image, ratings, application_handled_by, review_date
  }
  Review.findOneAndUpdate({ _id: id }, parsedReview)
    .then((result) => {
      res.send({ message: "Success" });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err)
    });

  try {
    ReviewBackup.create(parsedReview);
    console.log("Created Review Backup")
  } catch (error) {
    console.log("Error Occured Creating A Review Backup");
  }
};

const deleteReview = async (req, res) => {
  const { id } = req.params;

  const filter = { _id: id };

  Review.deleteOne(filter)
    .then((result) => res.send({ message: "Success" }))
    .catch((err) => res.status(400).send(err));
};


module.exports = {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  aggregateReviews
}