const nock = require("nock");
const myProbotApp = require("../src/index.js");
import { Probot, ProbotOctokit } from "probot";
import * as payload from "./fixtures/issues.opened.json";
import * as fs from "node:fs";
import * as path from "node:path";

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
  probot.load(myProbotApp);
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
  probot = undefined;
});

test("creates a pull request to update versions when a release is created", async () => {
  const mock = nock("https://api.github.com")
    .get("/repos/hiimbex/test-repo-a/git/ref/heads%2Fmain")
    .reply(200, {
      object: {
        sha: "main-sha",
      },
    })
    .post("/repos/hiimbex/test-repo-a/git/refs", (body) => {
      expect(body).toEqual({
        ref: "refs/heads/update-version/v2.4.0",
        sha: "main-sha",
      });
      return true;
    })
    .reply(200, {})
    .get("/repos/hiimbex/test-repo-a/contents/files.json")
    .reply(200, {
      content: Buffer.from(
        JSON.stringify([
          {
            name: "b",
            version: "0.0.1",
          },
        ])
      ),
    })
    .put("/repos/hiimbex/test-repo-a/contents/files.json", (body) => {
      expect(body).toEqual({
        branch: "update-version/v2.4.0",
        content:
          "WwogIHsKICAgICJuYW1lIjogImIiLAogICAgInZlcnNpb24iOiAidjIuNC4wIgogIH0KXQo=",
        message: "test commit",
      });
      return true;
    })
    .reply(200)
    .post(`/repos/hiimbex/test-repo-a/pulls`, (body) => {
      expect(body).toEqual({
        base: "main",
        head: "update-version/v2.4.0",
        title: "update to version v2.4.0",
      });
      return true;
    })
    .reply(200, {
      node_id: "test-node-id",
    })
    .post("/graphql", (body) => {
      expect(body).toEqual({
        query: `mutation MyMutation {
  enablePullRequestAutoMerge(input: { pullRequestId: \"test-node-id\", mergeMethod: SQUASH }) {
    clientMutationId
  }
}
`,
      });
      return true;
    })
    .reply(200);

  // Receive a webhook event
  await probot.receive({ name: "release.released", payload });

  expect(mock.pendingMocks()).toEqual([]);
});
