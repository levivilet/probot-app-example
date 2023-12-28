const nock = require("nock");
const myProbotApp = require("../src/index.js");
const { Probot, ProbotOctokit } = require("probot");
const payload = require("./fixtures/issues.opened.json");
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

/**
 * @type {any}
 */
let probot;

beforeEach(() => {
  nock.disableNetConnect();
  probot = new Probot({
    appId: 123,
    privateKey,
    // disable request throttling and retries for testing
    Octokit: ProbotOctokit.defaults({
      retry: { enabled: false },
      throttle: { enabled: false },
    }),
  });
  // Load our app into probot
  probot.load(myProbotApp);
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

test.skip("creates a pull request to update versions when a release is created", async () => {
  const mock = nock("https://api.github.com")
    // Test that we correctly return a test token
    .post("/app/installations/2/access_tokens")
    .reply(200, {
      token: "test",
      permissions: {
        issues: "write",
      },
    })
    .get("/repos/hiimbex/test-repo-a/git/ref/heads%2Fmain")
    .reply(200, {
      object: {
        sha: "main-sha",
      },
    })
    .post("/repos/hiimbex/test-repo-a/git/refs")
    .reply(200, {});
  // .post("");

  // Test that a comment is posted
  // .post("/repos/hiimbex/testing-things/issues/1/comments", (body) => {
  //   expect(body).toMatchObject(issueCreatedBody);
  //   return true;
  // })
  // .reply(200);

  // Receive a webhook event
  await probot.receive({ name: "release.released", payload });

  expect(mock.pendingMocks()).toStrictEqual([]);
});
