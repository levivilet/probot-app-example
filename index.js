const { Context } = require("probot");

/**
 *
 * @param {Context} ctx
 * @param {*} owner
 * @param {*} repo
 * @param {*} branch
 * @returns
 */
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
    const { payload, octokit } = context;
    const tagName = payload.release.tag_name;
    const owner = payload.repository.owner.login;
    const baseBranch = "main";
    const repo = "test-repo-a";
    console.log(tagName);
    console.log("release was released" + payload.repository.name);

    const newBranch = `update-version/${tagName}`;

    const mainBranchRef = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const newBranchRef = await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: mainBranchRef.data.object.sha,
    });
    console.log("created branch");

    const currentCommit = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: newBranchRef.data.object.sha,
    });

    const newCommit = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: "test commit",
      tree: currentCommit.data.tree.sha,
      parents: [currentCommit.data.sha],
    });

    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${newBranch}`,
      sha: newCommit.data.sha,
    });

    await octokit.rest.pulls.create({
      owner,
      repo,
      head: newBranch,
      base: baseBranch,
      title: `update to version ${tagName}`,
    });
  });
};
