# Alias git to g and set up bash autocomplete for g.
# --------------------------------------------------
alias g="git"
source ~/.git-completion.bash
__git_complete g __git_main

# Set up vim as default editor useful for git commit messages etc.
# --------------------------------------------------
export EDITOR=vim
