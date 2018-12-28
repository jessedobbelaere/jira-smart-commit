#!/usr/bin/env node

const fs = require("fs");

/**
 * If commit message title:
 *   - Doesn't start with Merge branch
 *   - Doesn't start with Merge pull request
 *   - Branch name starts with ${jiraTag}-XXX (e.g. TAG-123-branch-description)
 *   - Branch name is not a forbidden branch (master/develop)
 * then prepend the JIRA issue tag to the commit message.
 * E.g My awesome commit -> TAG-123 My awesome commit
 */

if (!process.argv[2] && !process.env.TAG_MATCHER ) {
    console.error("Please run this script with the JIRA ticket prefix as CLI argument " +
      "(e.g. node smart-commit-msg.js SPAN) or pass regular expression as envirement variable " +
      "(e.g. TAG_MATCHER=\\\"SPAN-[0-9]+\\\" node smart-commit-msg.js)");
    process.exit(1);
}

/**
 * @param {string} commitMessage
 * @returns {boolean}
 */
const isInvalidMessage = (commitMessage) => {
    const startsWithMergeBranch = (commitMessage) => commitMessage.indexOf("Merge branch") === 0;
    const startsWithMergePR = (commitMessage) => commitMessage.indexOf("Merge pull request") === 0;
    return !startsWithMergeBranch(commitMessage) && !startsWithMergePR(commitMessage);
};

/**
 * @returns {string}
 */
const getBranchName = () => {
    const branchName = fetchBranchNameFromGit();
    if (["master", "develop"].includes(branchName)) {
        console.error(`Hold your horses! You cannot commit directly to '${branchName}'. Please set up a PR to 'master' from GitHub and merge from there`);
        process.exit(1);
    }
    return branchName;
};

/**
 * @returns {String}
 */
const fetchBranchNameFromGit = () => {
    return require("child_process").execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).split("\n")[0]
};

/**
 * @param {string} branchName
 * @returns {boolean}
 */
const getIssueTagFromBranchName = (branchName) => {
    const matched = branchName.match(tagMatcher);
    const index = process.env.TAG_MATCH_INDEX ? Number(process.env.TAG_MATCH_INDEX) : 0;
    if (process.env.DEBUG === 'true') {
        console.log({branchName, tagMatcher, index, matched});
    }
    return matched && matched[index];
};

const jiraTag = process.argv[2];
const tagMatcher = process.env.TAG_MATCHER ? new RegExp(process.env.TAG_MATCHER, "i") : new RegExp(`^${jiraTag}-\\d+`, "i");
const commitMsgFile = process.env.GIT_PARAMS || process.env.HUSKY_GIT_PARAMS;
const commitMsg = fs.readFileSync(commitMsgFile, { encoding: "utf-8" });
const branchName = getBranchName();
const issueTag = getIssueTagFromBranchName(branchName);
const rawCommitMsgTitle = commitMsg.split("\n")[0];

if (issueTag && isInvalidMessage(rawCommitMsgTitle)) {
    // Add the JIRA issue tag to commit message title
    const ticketTag = issueTag.toUpperCase();
    const commitMsgTitle = rawCommitMsgTitle.replace(ticketTag, "").trim();
    const messageLines = commitMsg.split("\n");
    messageLines[0] = `${ticketTag} ${commitMsgTitle}`;
    fs.writeFileSync(commitMsgFile, messageLines.join("\n"), { encoding: "utf-8" });
} else {
    fs.writeFileSync(commitMsgFile, commitMsg, { encoding: "utf-8" });
}
