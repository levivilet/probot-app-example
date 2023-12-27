const getNewValue = (value, version) => {
  return value.map((item) => {
    if (item.name === "b") {
      return {
        ...item,
        version,
      };
    }
    return item;
  });
};

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
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
    const filesPath = "files.json";
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

    const filesJson = await context.octokit.rest.repos.getContent({
      owner,
      repo,
      path: filesPath,
    });

    if (!("content" in filesJson.data)) {
      return;
    }
    const filesJsonDecoded = Buffer.from(
      filesJson.data.content,
      "base64"
    ).toString();
    const filesJsonValue = JSON.parse(filesJsonDecoded);
    console.log(filesJsonValue);
    const filesJsonValueNew = getNewValue(filesJsonValue, tagName);
    const filesJsonStringNew =
      JSON.stringify(filesJsonValueNew, null, 2) + "\n";
    const filesJsonBase64New =
      Buffer.from(filesJsonStringNew).toString("base64");

    await context.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filesPath,
      message: "test commit",
      content: filesJsonBase64New,
      branch: newBranch,
      sha: filesJson.data.sha,
    });

    const pullRequestData = await octokit.rest.pulls.create({
      owner,
      repo,
      head: newBranch,
      base: baseBranch,
      title: `update to version ${tagName}`,
    });
    const pullRequestNumber = pullRequestData.data.number;

    const detailedPullRequestData = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    await octokit.graphql(
      `mutation MyMutation {
  enablePullRequestAutoMerge(input: {pullRequestId: "${detailedPullRequestData.data.node_id}", mergeMethod: SQUASH}) {
    clientMutationId
  }
}
  `,
      {}
    );
  });
};
