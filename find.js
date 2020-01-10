const { spawnSync } = require("child_process");

const spawnOptions = { encoding: "utf8" };
const branch = spawnSync("git", ["branch", "-r"], spawnOptions);
const branches = branch.stdout.split(/\s+/);

branches.forEach(branch => {
  if (branch === "") {
    return;
  }

  const gitShowArgs = ["show", "-s", "--format=%an %ae", branch];
  const authorInfo = spawnSync("git", gitShowArgs, spawnOptions);

  if (authorInfo.stdout.match("Brian")) {
    const gitLogArgs = ["log", "--format=oneline", `origin/master..${branch}`];
    const gitBranchInfo = spawnSync("git", gitLogArgs, spawnOptions);
    const numberOfCommitsInBranch = gitBranchInfo.stdout.split(/\n/).length - 1;

    if (numberOfCommitsInBranch === 0) {
      console.log(`Deleting ${branch.replace(/origin\//, "")}`);

      spawnSync("git", [
        "push",
        "origin",
        // "-n",
        "--delete",
        branch.replace(/origin\//, "")
      ]);
    }

    // console.log(authorInfo.stdout.trimEnd(), branch, numberOfCommitsInBranch);
  }
});
