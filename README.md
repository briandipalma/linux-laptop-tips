linux-laptop-cheat-sheet
=================

`sudo modprobe i8k force=1`

`sensors` (lm_sensors) - prints out hardware sensors reading, includes temp/fan speed

Set right fan on high and leaves the left unchanged

`i8kfan - 2`

http://www.cyberciti.biz/faq/controlling-dell-fan-speeds-temperature-on-ubuntu-debian-linux

https://ask.fedoraproject.org/question/25197/fan-on-my-laptop-runs-all-the-time-at-maximum-speed/

No more sudo
------------

I recommend doing this once instead:

`sudo chown -R $USER /usr/local`

That sets your user account as the owner of the /usr/local directory, so that you can just issue normal commands in there. Then you won't ever have to use sudo when you install node or issue npm commands.

It's much better this way. `/usr/local` is supposed to be the stuff you installed, after all.

Prompt
------

https://github.com/nojhan/liquidprompt

Synergy
---------

http://superuser.com/questions/77734/synergy-linux-keyboard-problem

Power management
----------------

sudo pm-powersave false

/usr/lib/pm-utils/power.d/wireless

VPN
---

`sudo vpnc /home/$USER/vpnc.conf`

AVCONV
---

avconv -i in.mp4 -b 320k out.mp3

GIT
---

* Copy `git-completion.bash` from `<your git doc folder>/etc/git-completion.bash/` (or GH) to `~/.git-completion.bash`
* `find / -type f -name "git-completion.bash" 2> err.log` will find the file
* add `source ~/.git-completion.bash` to your `.bashrc`
* `__git_complete g __git_main` after that line

https://github.com/so-fancy/diff-so-fancy

Y-DL
---

`youtube-dl -u <user> :ytwatchlater --dump-single-json --flat-playlist | youtube-dl --load-info -`

Atom
---
* docblockr
* es-identifier-highlight
* linter
* linter-eslint
* minimap
* project-manager
* git-time-machine
* file-icons
* jumpy
* last-cursor-position
* find-selection

Reinstall
--------
Swap is required for laptop suspend.
