import { Router } from "express";
import { searchPeople, getPersonDetail, shortestPathBetweenPeople } from "../queries/people.js";

export const peopleRouter = Router();

peopleRouter.get("/", async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    res.json(await searchPeople(search));
  } catch (err) {
    next(err);
  }
});

peopleRouter.get("/path", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Query params 'from' and 'to' are required" });
    }
    const path = await shortestPathBetweenPeople(from, to);
    if (!path) return res.status(404).json({ error: "No connection found within 8 hops" });
    res.json(path);
  } catch (err) {
    next(err);
  }
});

peopleRouter.get("/:id", async (req, res, next) => {
  try {
    const person = await getPersonDetail(req.params.id);
    if (!person) return res.status(404).json({ error: "Person not found" });
    res.json(person);
  } catch (err) {
    next(err);
  }
});
