# Alias git to g and set up bash autocomplete for g.
# --------------------------------------------------

alias g="git"
source ~/.git-completion.bash
__git_complete g __git_main

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

# Paths for applications
# --------------------------------------------------

export JAVA_HOME=/usr/java/jdk1.8.0_66/
export PATH=$PATH:$JAVA_HOME/bin:$HOME/apps/apache-maven-3.3.9/bin

# colours
# -------------------------------------------------

PS1='\e[33;1m\u@\h: \e[31m\W\e[0m \$ '
