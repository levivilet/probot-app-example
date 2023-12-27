const getBranchHeadSha = async (ctx, owner, repo) => {
  const res = await ctx.octokit.git.getRef({
    owner,
    repo,
    ref: `heads/main`,
  });
  const ref = res.data.object;
  return ref.sha;
};

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });

  app.on("release.released", async (info) => {
    const tagName = info.payload.release.tag_name;
    const owner = info.payload.repository.owner.login;
    const repo = "test-repo-a";
    console.log(tagName);
    console.log("release was released" + info.payload.repository.name);

    const branchName = `update-version/${tagName}`;

    const sha = await getBranchHeadSha(owner, repo);
    const result = await info.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    });
    const branchSha = result.data.object.sha;
    const { data: pr } = await info.octokit.pulls.create({
      owner,
      repo,
      head: branchName,
      base: "main",
      body: `update to version ${tagName}`,
    });
    console.log("created pr");
  });
};
