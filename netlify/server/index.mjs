// Netlify Server entrypoint: runs the existing Express app unchanged.
// app.js calls app.listen(process.env.PORT), which Netlify sets before import.
import "../../app.js";
