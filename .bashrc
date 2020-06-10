# Alias git to g and set up bash autocomplete for g.
# --------------------------------------------------

alias g="git"
source ~/.git-completion.bash
__git_complete g __git_main

# Add git info to prompt
# -------------------------------------------------

# Set config variables first
GIT_PROMPT_ONLY_IN_REPO=1
GIT_PROMPT_SHOW_UNTRACKED_FILES=no
source ~/.bash-git-prompt/gitprompt.sh

# Set up vim as default editor useful for git commit messages etc.
# --------------------------------------------------

export EDITOR=vim

# Make terminal better
# --------------------------------------------------

alias l='ls -AFGhl'
alias ~='cd ~'
alias c='clear'
alias ..='cd ../'
alias ...='cd ../..'
alias ....='cd ../../..'
alias v=vim
alias cd-='cd -'
alias fhere='find . -name '

# npm aliases
# --------------------------------------------------

alias ni='npm install'
alias nis='npm install --save'
alias nid='npm install --save-dev'
alias nig='npm install --global'
alias nt='npm test'
alias nl='npm link'
alias nr='npm run'
alias nf='npm cache clean && rm -rf node_modules && npm install'

# yarn aliases
# --------------------------------------------------

alias yi='yarn'
alias ya='yarn add'
alias yt='yarn test'
alias yr='yarn run'
alias ys='yarn start'
alias yul='yarn unlink; yarn link'
alias yl='yarn link'

# Paths for applications
# --------------------------------------------------

# export JAVA_HOME=/usr/java/jdk1.8.0_66/
# export PATH=$PATH:$JAVA_HOME/bin:$HOME/apps/apache-maven-3.3.9/bin

# colours
# -------------------------------------------------

TIME='\033[01;31m\]\t \033[01;32m\]'
HOST='\033[02;36m\]\h'; HOST=' '$HOST
LOCATION=' \033[00;33m\]\W \[\033[00m\] \n\$ '
PS1=$TIME$USER$HOST$LOCATION
