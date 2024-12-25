# JIRA Smart Commit

![tests](https://github.com/jessedobbelaere/jira-smart-commit/workflows/run-tests/badge.svg)
[![GitHub release](https://img.shields.io/github/release/jessedobbelaere/jira-smart-commit.svg)](https://github.com/jessedobbelaere/jira-smart-commit/releases/latest)
[![Dependabot](https://img.shields.io/badge/dependabot-active-brightgreen?style=flat-square&logo=dependabot)](https://dependabot.com)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dt/jira-smart-commit.svg)](https://www.npmjs.com/package/jira-smart-commit)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

A Node.js git hook script to prefix commits automatically with the JIRA ticket, based on a branch name.

## Usage

### Installation

1. Install [Husky](https://www.npmjs.com/package/husky) in your project to configure Git hooks easily.

```bash
npm install --save-dev husky
npx husky init
```

2. Install this package in your project:

```bash
npm install --save-dev jira-smart-commit
```

3. Configure scripts in `package.json`. The script expects his first argument to be the JIRA tag of the project.

```bash
# .husky/commit-msg
npx jira-smart-commit YOUR_JIRA_ISSUE_KEY
```

Alternatively: use a regex to detect the Jira `ISSUE_KEY` in your branch.

-   `TAG_MATCHER` - regular expression
-   `TAG_MATCH_INDEX` - match index

Example: if your branch names looke like `feature/JRA-1234/some-description` template

```bash
# .husky/commit-msg
TAG_MATCHER=\"^[^/]+/(JRA-[0-9]+)\" TAG_MATCH_INDEX=1 npx jira-smart-commit
```

4. Commit with git like usual. If the branch was prefixed with a JIRA tag, your commit message will get a Jira prefix added with
   the same tag.

```
Branch: JRA-411-husky-git-hooks
Commit message: "Add git hooks to project" → "JRA-411 Add git hooks to project"
```
