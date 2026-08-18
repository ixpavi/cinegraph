import { Router } from "express";
import { listUsers, getUserRatings, getRecommendationsForUser } from "../queries/recommendations.js";

export const recommendationsRouter = Router();

recommendationsRouter.get("/users", async (req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (err) {
    next(err);
  }
});

recommendationsRouter.get("/users/:id/ratings", async (req, res, next) => {
  try {
    res.json(await getUserRatings(req.params.id));
  } catch (err) {
    next(err);
  }
});

recommendationsRouter.get("/users/:id", async (req, res, next) => {
  try {
    res.json(await getRecommendationsForUser(req.params.id));
  } catch (err) {
    next(err);
  }
});
