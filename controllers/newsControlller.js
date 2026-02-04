const Blog = require("../models/news");
const BlogAndNewsBackup = require("../models/blogAndNewsBackup");

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 5000;
const MAX_SKIP = 50000;

const getAllNews = async (req, res) => {
  const queryParams = req.query.filter;
  const slicedBlogs = req.query.give;
  const limitParam = req.query.limit;
  const headers = JSON.stringify(req.headers);
  const drafts = JSON.parse(headers).drafts;
  const queryParamsArr = queryParams ? queryParams.split(",") : true;

  const sort = { createdAt: -1 };
  let filter = {};

  if (queryParamsArr)
    filter = {
      isPublished: drafts == "true" ? false : true,
      tags: { $all: queryParamsArr },
    };

  if (!queryParams)
    filter = {
      isPublished: drafts == "true" ? false : true,
    };

  const rawSkip = (slicedBlogs === undefined || slicedBlogs === "undefined")
    ? 0
    : Math.max(0, Math.floor(Number(slicedBlogs)) || 0);
  const skip = Math.min(rawSkip, MAX_SKIP);

  const rawLimit = (limitParam !== undefined && limitParam !== "")
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(limitParam)) || DEFAULT_PAGE_SIZE))
    : DEFAULT_PAGE_SIZE;
  const limit = Number.isNaN(rawLimit) ? DEFAULT_PAGE_SIZE : rawLimit;

  Blog.find()
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .then((result) => {
      const parsedBlogs = result.map((blog) => {
        const parsedObj = {
          title: blog.title,
          url: blog?.url,
          description: blog?.description,
          createdAt: blog.createdAt,
          image: blog.image,
          views: blog.views,
          tags: blog.tags,
          _id: blog._id,
          tableOfContents: blog.tableOfContents,
          isPublished: blog.isPublished,
          author: blog?.author,
        };
        return parsedObj
      });

      res.send(parsedBlogs);
    })
    .catch((err) => res.status(400).send(err));
};

const getDraftsCount = async (req, res) => {
  const sort = { createdAt: -1 };
  const find = { isPublished: false };

  Blog.find()
    .find(find)
    .sort(sort)
    .then((result) => {
      const resultsLength = result.length;
      res.send({ totalDrafts: resultsLength });
    })
    .catch((err) => res.status(400).send(err));
};

const updateNewsViews = (result) => {
  const updatedBlog = {
    views: `${parseInt(result.views) + 1}`.toString(),
    blog: result.blog,
    description: result?.description,
    image: result.image,
    title: result.title,
    url: result?.url,
    tags: result.tags,
    tableOfContents: result.tableOfContents,
    isPublished: result.isPublished,
    author: result?.author,
  };

  Blog.findByIdAndUpdate(result._id, updatedBlog)
    .then((res) => {
      console.log("Views Updated", "success");
    })
    .catch((err) => console.log("error occured updating views", err));
};

const getNewsByTitle = async (req, res) => {
  const { title } = req.params;
  const parsedTitle = decodeURIComponent(title);


  const filter = {
    $or: [
      { slug: title }, // Try to match the raw title as a slug (for new blogs)
      { url: parsedTitle } // Try to match the decoded title as a URL (for old blogs)
    ]
  };

  Blog.findOne(filter)
    .then((result) => {
      if (result) {
        res.send(result);
        updateNewsViews(result);
      } else {
        res.status(400).send(result);
      }
    })
    .catch((err) => res.send(err));
};

const searchBlog = async (req, res) => {
  const query = req.query.q;

  await Blog.aggregate([
    {
      $search: {
        "index": "news_article", "text": {
          "path": "title",
          "query": query

        }
      }
    }
  ]).then((result) => {
    if (result) {
      if (result.length > 0) {
        res.send(result);
      } else {
        res.send([]);
      }
    } else {
      res.status(400).send([]);
    }
  }).catch((err) => res.send(err));

};

const createNews = async (req, res) => {
  try {
    const {
      title,
      slug,
      url,
      description,
      image,
      views,
      blog: blogData,
      tags,
      tableOfContents,
      isPublished,
      author,
    } = req.body;

    const blog = new Blog({
      title: title.trim(),
      url,
      slug,
      description,
      image,
      views,
      blog: blogData,
      tags,
      tableOfContents,
      isPublished,
      author,
    });

    blog
      .save()
      .then((results) =>
        Blog.find()
          .then((result) => res.json(result))
          .catch((err) => res.status(400).res.send(result))
      )
      .catch((err) => res.status(400).send(err));
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({ error: "Failed to add blog" });
  }

  BlogAndNewsBackup.create(req.body)
    .then(() => {
      console.log("Blog Backup Created");
    })
    .catch((error) => {
      console.log("Error: Blog Backup", error);
    });
};

const updateNews = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    url,
    slug,
    description,
    image,
    views,
    blog: blogData,
    tags,
    tableOfContents,
    isPublished,
    author,
  } = req.body;
  const filter = { _id: id };

  const updatedBlog = {
    title,
    url,
    slug,
    description,
    image: image,
    blog: blogData,
    tags,
    tableOfContents,
    author,
    isPublished,
  };

  Blog.findOneAndUpdate(filter, updatedBlog)
    .then((result) => res.send({ message: "Success" }))
    .catch((err) => res.status(400).send(err));

  BlogAndNewsBackup.create(req.body)
    .then(() => {
      console.log("Blog Backup Created");
    })
    .catch((error) => {
      console.log("Error: Blog Backup", error);
    });
};

const deleteNews = async (req, res) => {
  const { id } = req.params;

  const filter = { _id: id };

  Blog.deleteOne(filter)
    .then((result) => res.send({ message: "Success" }))
    .catch((err) => res.status(400).send(err));
};

module.exports = {
  getAllNews,
  getDraftsCount,
  getNewsByTitle,
  createNews,
  updateNews,
  deleteNews,
  searchBlog
};
