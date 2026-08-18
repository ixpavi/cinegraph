import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { MoviePage } from "./pages/MoviePage";
import { PersonPage } from "./pages/PersonPage";
import { ConnectionsPage } from "./pages/ConnectionsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="movies/:id" element={<MoviePage />} />
          <Route path="people/:id" element={<PersonPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
