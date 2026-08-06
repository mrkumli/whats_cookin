import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pantry from "./pages/Pantry";
import RecipeDetails from "./pages/RecipeDetails";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pantry" element={
          <PrivateRoute><Pantry /></PrivateRoute>
        } />
        <Route path="/recipes/:recipeId" element={
          <PrivateRoute><RecipeDetails /></PrivateRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;