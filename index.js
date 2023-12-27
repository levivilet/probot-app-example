const getBranchHeadSha = async (ctx, owner, repo, branch) => {
  const res = await ctx.octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
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

  app.on("release.released", async (context) => {
    const tagName = context.payload.release.tag_name;
    const owner = context.payload.repository.owner.login;
    const repo = "test-repo-a";
    console.log(tagName);
    console.log("release was released" + context.payload.repository.name);

    console.log("git is", typeof context.octokit.rest.git);
    const branchName = `update-version/${tagName}`;

    const mainBranchSha = await getBranchHeadSha(context, owner, repo, "main");
    const result = await context.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainBranchSha,
    });
    console.log("created branch");

    // const branchSha = result.data.object.sha;
    const branchSha = await getBranchHeadSha(context, owner, repo, branchName);

    console.log("branch sha", branchSha);
    await context.octokit.rest.git.createCommit({
      message: "test commit",
      owner,
      repo,
      tree: branchSha,
    });
    // const { data: pr } = await context.octokit.pulls.create({
    //   owner,
    //   repo,
    //   head: branchName,
    //   base: "main",
    //   body: `update to version ${tagName}`,
    // });
  });
};
