import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import childProcess from "child_process";

vi.mock("fs");
vi.mock("child_process");

describe("index.js", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();

        // Reset process env and args
        process.env.HUSKY_GIT_PARAMS = "COMMIT_EDITMSG";
        delete process.argv[2];
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetAllMocks();
        vi.resetModules();
    });

    it.each([
        ["SPAN", "SPAN-1-proof-of-concept", "Initial commit✨", "SPAN-1 Initial commit✨"],
        ["PROJECT", "PROJECT-3-githook-test", "Add support for githooks", "PROJECT-3 Add support for githooks"],
        ["TAG", "TAG-5032-add-readme", "Add readme to project", "TAG-5032 Add readme to project"],
    ])(
        "should add a prefix to my unprefixed commit message",
        async (jiraPrefix, branchName, commitMessage, expected) => {
            await expect(executeScript(jiraPrefix, branchName, commitMessage)).resolves.to.equal(expected);
        },
    );

    it("should add a prefix to my unprefixed commit message by detecting the tag using regex", async () => {
        process.env.TAG_MATCHER = "^[^/]+/(SPAN-[0-9]+)";
        process.env.TAG_MATCH_INDEX = "1";
        await expect(executeScript(undefined, "FEAT/SPAN-1234/init", "Initial commit")).resolves.to.equal(
            "SPAN-1234 Initial commit",
        );
        delete process.env.TAG_MATCHER;
        delete process.env.TAG_MATCH_INDEX;
    });

    it.each([
        ["SPAN", "SPAN-1-proof-of-concept", "SPAN-1 Initial commit✨", "SPAN-1 Initial commit✨"],
        [
            "PROJECT",
            "PROJECT-3-githook-test",
            "PROJECT-3 Add support for githooks",
            "PROJECT-3 Add support for githooks",
        ],
        ["TAG", "TAG-5032-add-readme", "TAG-5032 Add readme to project", "TAG-5032 Add readme to project"],
    ])(
        "should not add a prefix again to my already prefixed commit message",
        async (jiraPrefix, branchName, commitMessage, expected) => {
            await expect(executeScript(jiraPrefix, branchName, commitMessage)).resolves.to.equal(expected);
        },
    );

    it("should not add a prefix in merge pull requests", async () => {
        const commitMergeMessage =
            "Merge branch 'develop' of github.com:jessedobbelaere/jira-smart-commit into bugfixes";
        await expect(executeScript("SPAN", "SPAN-1-proof-of-concept", commitMergeMessage)).resolves.to.equal(
            commitMergeMessage,
        );
    });

    it("should not add a prefix if a branch was not prefixed", async () => {
        await expect(executeScript("TAG", "conquer-the-world-PoC", "Initial commit")).resolves.to.equal(
            "Initial commit",
        );
    });

    const executeScript = async (jiraPrefix, branchName, commitMessage) => {
        // Mock execution environment
        process.env.HUSKY_GIT_PARAMS = "COMMIT_EDITMSG";
        process.argv[2] = jiraPrefix; // Set CLI argument for JIRA prefix
        vi.mocked(childProcess.execSync).mockReturnValue(branchName);
        vi.mocked(fs.readFileSync).mockReturnValueOnce(commitMessage);
        const writeFileMock = vi.mocked(fs.writeFileSync);

        // Run script
        const modulePath = require.resolve("./index.js");
        await import(modulePath);

        return writeFileMock.mock.calls[0][1];
    };
});
