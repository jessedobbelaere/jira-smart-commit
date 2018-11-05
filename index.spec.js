const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require( 'proxyquire' ).noCallThru().noPreserveCache();

describe('index.js', () => {
    it('should add a prefix to my unprefixed commit message', () => {
        expect(executeScriptMock("SPAN", "SPAN-1-proof-of-concept", "Initial commit✨")).to.equal("SPAN-1 Initial commit✨");
        expect(executeScriptMock("PROJECT", "PROJECT-3-githook-test", "Add support for githooks")).to.equal("PROJECT-3 Add support for githooks");
        expect(executeScriptMock("TAG", "TAG-5032-add-readme", "Add readme to project")).to.equal("TAG-5032 Add readme to project");

        process.env.TAG_MATCHER = "^[^/]+/(SPAN-[0-9]+)";
        process.env.TAG_MATCH_INDEX = "1";
        process.env.DEBUG = "true";
        expect(executeScriptMock(undefined, "feature/SPAN-1234/init", "Initial commit")).to.equal('SPAN-1234 Initial commit');
        delete process.env.TAG_MATCHER;
        delete process.env.TAG_MATCH_INDEX;
        delete process.env.DEBUG;
    });

    it('should not add a prefix again to my already prefixed commit message', () => {
        expect(executeScriptMock("SPAN", "SPAN-1-proof-of-concept", "SPAN-1 Initial commit✨")).to.equal("SPAN-1 Initial commit✨");
        expect(executeScriptMock("PROJECT", "PROJECT-3-githook-test", "PROJECT-3 Add support for githooks")).to.equal("PROJECT-3 Add support for githooks");
        expect(executeScriptMock("TAG", "TAG-5032-add-readme", "TAG-5032 Add readme to project")).to.equal("TAG-5032 Add readme to project");
    });

    it('should not add a prefix in merge pull requests', () => {
        const commitMergeMessage = "Merge branch 'develop' of github.com:jessedobbelaere/jira-smart-commit into bugfixes";
        expect(executeScriptMock("SPAN", "SPAN-1-proof-of-concept", commitMergeMessage)).to.equal(commitMergeMessage);
    });

    it('should not add a prefix if branch was not prefixed', () => {
        expect(executeScriptMock("TAG", "conquer-the-world-PoC", "Initial commit")).to.equal("Initial commit");
    });

    /**
     *
     * @param {string} jiraProjectPrefix
     * @param {string} gitBranchName The branch name
     * @param {string} commitMessage
     * @returns {string}
     */
    const executeScriptMock = (jiraProjectPrefix, gitBranchName, commitMessage) => {
        process.argv = ["node", "index.js", jiraProjectPrefix];
        const readFileSync = sinon.stub().returns(commitMessage);
        const writeFileSync = sinon.stub();

        // Mock the script dependencies
        proxyquire('./index.js', {
            fs: {
                readFileSync,
                writeFileSync
            },
            child_process: { execSync: () => gitBranchName }
        });

        // Return the prefixed commit message
        return writeFileSync.args[0][1];
    };
});
