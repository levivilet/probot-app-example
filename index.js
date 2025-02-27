/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app, { getRouter }) => {
  const router = getRouter("/my-app");

  // Add a new route
  router.get("/hello-world", (req, res) => {
    res.send("Hello World");
  });
  // console.log({ getRouter });
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on("release.released", () => {
    console.log("release released");
  });
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
