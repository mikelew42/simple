import app, { el, div, h1, h2, h3, p, is, icon } from "./app.js";

h1("Hello World");

div(el("a", "Sub Page").attr("href", "sub"));
div(el("a", "Another Path").attr("href", "path/"));

h3("Step 1: Fork the Repo");
h3("Step 2: Configure GitHub Pages");
h3("Step 3: Profit");
