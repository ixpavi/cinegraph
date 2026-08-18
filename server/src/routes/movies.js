import { Router } from "express";
import {
  listMovies,
  countMovies,
  getMovieDetail,
  getSimilarMovies,
  listGenres,
} from "../queries/movies.js";

export const moviesRouter = Router();

moviesRouter.get("/genres", async (req, res, next) => {
  try {
    res.json(await listGenres());
  } catch (err) {
    next(err);
  }
});

moviesRouter.get("/", async (req, res, next) => {
  try {
    const { search = "", genre = "", page = "1", pageSize = "24" } = req.query;
    const limit = Math.min(Number(pageSize) || 24, 60);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const [movies, total] = await Promise.all([
      listMovies({ search, genre, limit, offset }),
      countMovies({ search, genre }),
    ]);
    res.json({ movies, total, page: Number(page) || 1, pageSize: limit });
  } catch (err) {
    next(err);
  }
});

moviesRouter.get("/:id", async (req, res, next) => {
  try {
    const movie = await getMovieDetail(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

moviesRouter.get("/:id/similar", async (req, res, next) => {
  try {
    res.json(await getSimilarMovies(req.params.id));
  } catch (err) {
    next(err);
  }
});
