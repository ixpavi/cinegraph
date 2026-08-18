// Synthetic demo users with overlapping taste profiles, so the
// collaborative-filtering recommendation query has real signal to work
// with (shared high ratings between users in the same "cluster").

export const users = [
  {
    id: "ava",
    name: "Ava Whitfield",
    ratings: {
      "inception": 5, "the-dark-knight": 5, "interstellar": 5, "oppenheimer": 4,
      "dunkirk": 4, "the-matrix": 5, "dune": 4, "arrival": 4,
      "blade-runner-2049": 4, "the-departed": 3,
    },
  },
  {
    id: "ben",
    name: "Ben Ockonkwo",
    ratings: {
      "the-departed": 5, "goodfellas": 5, "the-wolf-of-wall-street": 4, "shutter-island": 4,
      "the-godfather": 5, "pulp-fiction": 5, "django-unchained": 4, "se7en": 4,
      "the-dark-knight": 4,
    },
  },
  {
    id: "chloe",
    name: "Chloe Baptiste",
    ratings: {
      "toy-story": 5, "coco": 5, "spirited-away": 5, "into-the-spider-verse": 4,
      "forrest-gump": 4, "la-la-land": 4, "the-grand-budapest-hotel": 4,
    },
  },
  {
    id: "dev",
    name: "Dev Anand Rao",
    ratings: {
      "the-avengers": 5, "iron-man": 5, "black-panther": 5, "into-the-spider-verse": 4,
      "the-dark-knight": 4, "dune": 4, "fellowship-of-the-ring": 4,
    },
  },
  {
    id: "elena",
    name: "Elena Marchetti",
    ratings: {
      "get-out": 5, "the-silence-of-the-lambs": 5, "se7en": 5, "parasite": 5,
      "knives-out": 4, "shutter-island": 4, "oppenheimer": 3,
    },
  },
  {
    id: "farid",
    name: "Farid Hosseini",
    ratings: {
      "the-shawshank-redemption": 5, "forrest-gump": 5, "good-will-hunting": 5,
      "the-godfather": 5, "1917": 4, "saving-private-ryan": 4, "oppenheimer": 5,
    },
  },
  {
    id: "grace",
    name: "Grace Lindqvist",
    ratings: {
      "la-la-land": 5, "eternal-sunshine": 5, "good-will-hunting": 4, "forrest-gump": 4,
      "coco": 4, "the-grand-budapest-hotel": 4,
    },
  },
  {
    id: "hana",
    name: "Hana Suzuki",
    ratings: {
      "1917": 5, "saving-private-ryan": 5, "dunkirk": 5, "oppenheimer": 5,
      "the-godfather": 4, "fellowship-of-the-ring": 4,
    },
  },
  {
    id: "ivan",
    name: "Ivan Petrov",
    ratings: {
      "dune": 5, "blade-runner-2049": 5, "arrival": 5, "the-matrix": 5,
      "fellowship-of-the-ring": 5, "interstellar": 5, "spirited-away": 4,
    },
  },
  {
    id: "julia",
    name: "Julia Novak",
    ratings: {
      "the-grand-budapest-hotel": 5, "knives-out": 5, "once-upon-a-time-in-hollywood": 4,
      "parasite": 4, "coco": 4, "toy-story": 4, "la-la-land": 4,
    },
  },
];
