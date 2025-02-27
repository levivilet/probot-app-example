
/**
 * @param {import('probot').Context<"release">} context
 */
const handleReleaseReleased = async (context) => {
  const { payload, octokit } = context;
  const tagName = payload.release.tag_name;
  const owner = payload.repository.owner.login;
  const baseBranch = "main";
  const repo = "test-repo-a";
  const filesPath = "files.json";
  console.log(tagName);
  console.log("release was released" + payload.repository.name);

};

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  app.on("release.released", handleReleaseReleased);
};
