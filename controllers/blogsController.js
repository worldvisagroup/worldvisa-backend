const Blog = require("../models/blog");
const BlogAndNewsBackup = require("../models/blogAndNewsBackup");

const getAllBlogs = async (req, res) => {
  try {

    const queryParams = req.query.filter;
    const slicedBlogs = req.query.give;
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

    Blog.find()
      .find(filter)
      .sort(sort)
      .skip(slicedBlogs === "undefined" ? undefined : slicedBlogs)
      .limit(slicedBlogs === "undefined" ? 0 : 10)
      .then((result) => {
        const parsedBlogs = result.map((blog) => {
          const parsedObj = {
            title: blog.title,
            slug: blog?.slug,
            description: blog?.description,
            createdAt: blog.createdAt,
            image: blog.image,
            views: blog.views,
            author: blog?.author,
            tags: blog.tags,
            tableOfContents: blog?.tableOfContents,
            isPublished: blog?.isPublished,
            url: blog?.url,
            _id: blog._id,
          };
          return parsedObj;
        });
        res.send(parsedBlogs);
      })
      .catch((err) => res.status(400).send(err));
  } catch (error) {
    res.status(400).send(error)
  }
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

const updateBlogViews = (result) => {
  const updatedBlog = {
    views: `${parseInt(result.views) + 1}`.toString(),
    blog: result.blog,
    description: result?.description,
    image: result.image,
    title: result.title,
    url: result?.url,
    tags: result.tags,
    tableOfContents: result.tableOfContents,
    author: result?.author,
    isPublished: result?.isPublished,
  };

  Blog.findByIdAndUpdate(result._id, updatedBlog)
    .then((res) => {
      console.log("Views Updated", "success");
    })
    .catch((err) => console.log("error occured updating views", err));
};

const getBlogByTitle = async (req, res) => {
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
        updateBlogViews(result);
      } else {
        res.status(404).send({ message: "Blog not found." });
      }
    })
    .catch((err) => {
      console.error("Error fetching blog:", err);
      res.status(500).send({ message: "Internal server error.", error: err.message });
    });
};

const searchBlog = async (req, res) => {
  const query = req.query.q;

  await Blog.aggregate([
    {
      $search: {
        "index": "article_search", "text": {
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

const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      image,
      views,
      blog: blogData,
      tags,
      tableOfContents,
      isPublished,
      author,
      url,
    } = req.body;

    const blog = new Blog({
      title: title.trim(),
      slug: slug,
      description,
      image,
      views,
      blog: blogData,
      tags,
      tableOfContents,
      isPublished,
      author,
      url,
    });

    blog
      .save()
      .then((results) => res.json({ message: "Success" }))
      .catch((err) => res.status(400).send(err));
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({ error: "Failed to add blog" });
  }

  // BlogAndNewsBackup.create(req.body)
  //   .then(() => {
  //     console.log("Blog Backup Created");
  //   })
  //   .catch((error) => {
  //     console.log("Error: Blog Backup", error);
  //   });
};

const updateBlog = async (req, res) => {
  const { id } = req.params;
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
  const filter = { _id: id };

  const updatedBlog = {
    title,
    slug,
    url,
    description,
    image,
    blog: blogData,
    tags,
    tableOfContents,
    isPublished,
    author,
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

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  const filter = { _id: id };

  Blog.deleteOne(filter)
    .then((result) => res.send({ message: "Success" }))
    .catch((err) => res.status(400).send(err));
};

module.exports = {
  getAllBlogs,
  getDraftsCount,
  getBlogByTitle,
  searchBlog,
  createBlog,
  updateBlog,
  deleteBlog,
};
