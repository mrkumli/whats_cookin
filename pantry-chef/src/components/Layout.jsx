import Navigation from "./Navigation";
import Footer from "./Footer";

// Layout
// Shared shell for every page: top nav, a consistent page container,
// and a footer. Pages only provide their own content; Layout takes
// care of making every page feel like part of the same app.
function Layout({ children }) {
  return (
    <div className="layout">
      <Navigation />
      <main className="page-container">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
