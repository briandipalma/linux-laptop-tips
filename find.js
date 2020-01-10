const { spawnSync } = require("child_process");

const author = "Brian";
const ignoredBranches = ["", "master", "->", "HEAD"];
const remote = "origin";
const remotePrefix = new RegExp(`^${remote}\\/`);
const spawnOptions = { encoding: "utf8" };

// Options
const showAuthorBranches = true;
const deleteMergedBranches = false;

// All remotes
const remoteBranch = spawnSync("git", ["branch", "-r"], spawnOptions);
const remoteBranches = remoteBranch.stdout.split(/\s+/);

remoteBranches.forEach(branch => {
  const branchName = branch.replace(remotePrefix, "");

  if (ignoredBranches.includes(branchName)) {
    return;
  }

  if (branch.startsWith(`${remote}/`) === false) {
    console.log(`Skipping ${branch}, from another remote.`);
  }

  if (showAuthorBranches) {
    const gitShowArgs = ["show", "-s", "--format=%an %ae", branch];
    const authorInfo = spawnSync("git", gitShowArgs, spawnOptions);

    if (authorInfo.stdout.match(author)) {
      console.log(authorInfo.stdout.trimEnd(), branchName);
    }
  }

  if (deleteMergedBranches) {
    const gitLogArgs = ["log", "--format=oneline", `origin/master..${branch}`];
    const gitBranchInfo = spawnSync("git", gitLogArgs, spawnOptions);
    const numberOfCommitsInBranch = gitBranchInfo.stdout.split(/\n/).length - 1;

    if (numberOfCommitsInBranch === 0) {
      console.log(`Deleting ${branchName}`);

      spawnSync(
        "git",
        ["push", "origin", "-n", "--delete", branchName],
        spawnOptions
      );
    }
  }
});
